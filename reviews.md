# Code Review: TrafficSense AI

Review date: 2026-10-15. Method: static reading of the code by five parallel reviewers plus one `/code-review` pass. Nothing was run against live TomTom, OpenWeather or AWS. Items marked *inferred* were not reproduced.

Note: the `/code-review` pass covered only the last commit (`HEAD~1...HEAD`), because the diff against `origin/main` was empty. The other reviewers covered the whole repo.

## Why the API keys look missing

- `backend/.env` has `TOMTOM_API_KEY`, `OPENWEATHER_API_KEY`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` set to empty values. `backend/.env.example` is the same.
- `frontend/.env.local` does not exist. Only `frontend/.env.local.example` is present, and `NEXT_PUBLIC_TOMTOM_API_KEY` is empty in it.
- Empty keys fail silently. `traffic.py:165-166`, `route.py:135-136` and `weather.py:80-81` return demo data with no error. The only signal is the `data_mode` field in responses.
- `backend/app/core/config.py:10` loads env files from relative paths (`.env`, `backend/.env`, `../backend/.env`). Keys only load if the server is started from the repo root or from `backend/`. Starting from anywhere else gives empty keys with no warning.

## Critical and high severity

1. **Root Docker build copies the secrets file into the image.** `Dockerfile:42` runs `COPY backend/ /app/backend/`. The root `.dockerignore` only excludes `.env`, `.env.*` and `*.env` at the top level, so `backend/.env` (with the TomTom, OpenWeather and AWS values) is included. Verified by reading the ignore rules; `docker build` not run. Any image already pushed with this layer should be treated as exposing those values. (Security review)
2. **Blocking calls inside async endpoints.** Endpoints are `async def` but call synchronous service methods (`endpoints.py:55, 65, 74, 88, 97, 106, 118`). Live TomTom calls use blocking httpx with a 10 s timeout across 25 segments in 5 threads (`traffic.py:182, 217-219`). A TomTom outage can stall the whole event loop for about 50 s per request. The chatbot has the same issue: `chatbot.py:250` calls the synchronous boto3 `converse` inside `async def chat` (`chatbot.py:131`), with no explicit timeout, up to five rounds. (Services review)
3. **No auth on the API.** None of the 12 endpoints checks a key or token. Chatbot routes call AWS Bedrock, so anyone who can reach the port can run up cost. `PUT /users/preferences` (`endpoints.py:131`) and `DELETE /chat/{id}` (`endpoints.py:179`) are open too. (Security and API reviews)
4. **TomTom key sent in the URL and possibly logged.** The key is a query parameter (`traffic.py:179`, `incident.py:200`, `route.py:144`). The root logger is at INFO (`core/middleware.py:13-16`). httpx logs full request URLs at INFO, so the key would appear in logs on every live call. *Inferred; confirm with one live call.* (API and services reviews)
5. **Conversations have no ownership check.** `chatbot.py:151-152` accepts any caller-supplied `conversation_id`, so anyone who knows or guesses an ID can read or continue another user's conversation. Conversations are also never evicted (`chatbot.py:63-100`). (Services review)
6. **Live failures are not cached.** When TomTom is unreachable or rejects the key, `traffic.py:224-233`, `incident.py:253-262` and `route.py:207-213` fall back to demo data and cache nothing. Every request repeats all 25 segment calls and pays the full timeout. (Code review and services review)
7. **Chat history pruning can orphan tool results.** `chatbot.py:81-84` and `91-94` cut the history to the last 20 messages without keeping tool-use and tool-result pairs together. The next Bedrock call may be rejected, and every later turn then returns the generic error until the chat is cleared. *Inferred from Bedrock's rules; not run.* (Services review)

## Medium severity

8. **Partial live results are cached as complete.** If 14 of 15 segment calls succeed, the result is cached as a full live result for the whole TTL, and the missing segment disappears silently (`traffic.py:228`). (Code review)
9. **Live route results are never cached.** Every route query is a billable TomTom call (`route.py:142`). (Code review)
10. **Zero incidents become fake incidents.** A valid live response with no incidents is not cached and falls back to demo incidents (`incident.py:253`). Errors do the same (`incident.py:253-262`). Live mode can show invented incidents. (Code review and services review)
11. **Alerts ignore live data.** `alerts.py:22-134` uses fixed templates such as "Congestion ratio exceeds 85%" on Silk Board and never calls the traffic service. Alerts are cached (`alerts.py:148-149`) and labelled "demo" (`alerts.py:159`), even in live mode. (Services review)
12. **Analytics always reports demo.** `analytics.py:47` hard-codes "demo", and `analytics.py:51` throws away the mode from `get_current_traffic()`. The chatbot then tells the model it is in demo mode (`chatbot_tools.py:454`). (Services review)
13. **Predictions do not use live data.** `prediction.py:86-99` builds model inputs from random values (lag speed, temperature, rain). The `current_speed` fields at `prediction.py:114` and `144` are random too, so they disagree with `/traffic/current`. (Services review)
14. **Unknown segment returns the first segment.** `prediction.py:61` (`or segments[:1]`) returns seg-001's prediction for any unknown `segment_id`, with no error. (Services review)
15. **Unresolved place names route to city centre.** `chatbot_tools.py:228-235` falls back to Bangalore centre when no landmark matches. The substring test at `chatbot_tools.py:232` means an empty or one-letter origin matches "majestic". (Services review)
16. **Training data leaks the target.** In `train_model.py`, the `lag_speed` and `lag_congestion` features come from the same hour that the target is generated from, not the previous hour. Measured correlation with the same-hour value is 0.906, against 0.755 for the true previous hour. Reported MAE, RMSE and R2 are inflated. `prediction.py` `_ml_predict` (around lines 86-96) builds serving inputs the same way, and the training and serving distributions differ (`U(0.5,1.2)` vs `U(0.6,1.0)`). Real-world accuracy is unknown. (Tests and dependencies review)
17. **Validation split is unused.** The validation set is passed in, but there is no early stopping and `n_estimators` is fixed at 200. (Tests and dependencies review)
18. **Frontend dashboard shows false "healthy" values on failure.** `frontend/src/app/page.tsx` shows 0% congestion with a LOW badge, 0 km/h, 0 incidents and a hardcoded 26°C when the backend fails. Only the loading state is handled. (Frontend review)
19. **Frontend trend deltas are hardcoded.** `page.tsx:158-162` shows "+4.2%" and "-2.1%" as live changes. The analytics page has a fixed "Baseline 45 km/h" and invented segment counts. (Frontend review)
20. **Chat re-sends the prompt.** The `?prompt=` effect in `frontend/src/app/chat/page.tsx:120-126` depends on `handleSend`, which changes identity after each response, so the same prompt can be sent again and again. (Frontend review)
21. **Map selection snaps back on refresh.** `traffic-map.tsx:166-177` re-selects the `?road=` segment on every 60 s refetch and moves the map, overwriting the user's click. (Frontend review)
22. **Settings toggle never syncs with the server.** `settings/page.tsx:42, 54-62` keeps local state forever, and a failed save shows "Enabled" with no rollback or message. (Frontend review)
23. **Production API URL defaults to localhost.** `Dockerfile:9` and `frontend/Dockerfile:10` bake in `http://localhost:8000`. `frontend/src/lib/api/client.ts:16` falls back to localhost too, so a build without the override calls the user's own machine. (Frontend review)
24. **Docs always on; DEBUG defaults to True.** `main.py:22-23` always enables `/docs` and `/redoc`. `config.py:22` defaults `DEBUG=True`, and no Dockerfile sets it to False. (Security review)
25. **Test packages ship to production.** `requirements.txt` lists `pytest` and `pytest-asyncio`, and the Dockerfile installs it, so both end up in the image. `pytest-asyncio` is unused. Dependencies are lower bounds only, with no lock file. Local venv is Python 3.14; the Docker base is 3.11. (Tests and dependencies review)
26. **Frontend package problems.** `cn` (`^0.3.0`) is an unrelated npm package, imported 14 times through `src/lib/utils.ts`. The shadcn helpers `clsx` and `tailwind-merge` are declared but never imported. `next-themes` is never imported. `shadcn` (a CLI) is in runtime dependencies. (Tests and dependencies review)
27. **Weak tests.** Several assert only a non-404 status or a field that may be empty, and `test_chatbot_tools_execute` accepts any of several strings. Nothing covers the ML path. All 22 tests pass locally. (Tests and dependencies review)

## Low severity

28. **Trained model loaded with pickle.** `backend/app/models/artifacts/xgb_speed_model.pkl` is tracked in git and loaded with `joblib.load` (`prediction.py:35`). Replacing that file would run code. (Security and tests reviews)
29. **Containers run as root.** None of the three Dockerfiles has a `USER` line. (Security review)
30. **Remote script piped to bash.** `Dockerfile:35` runs `curl … | bash -`. Base images are not pinned. (Security review)
31. **Silent AWS credentials from `aws.md`.** `config.py:75-108` reads credentials from an `aws.md` file it searches for, with loose regexes that could capture placeholder text. The current images do not include it. (Security review)
32. **Chatbot without AWS credentials returns 200.** `chatbot.py:172-176` returns a canned "not configured" message with HTTP 200. (API review)
33. **Chatbot tool errors leak internal text.** `chatbot_tools.py:283` returns `str(e)` to the model, which can repeat it to the user. (Services review)
34. **Duplicated TomTom fetch code.** `incident.py:193`, `route.py` and `traffic.py` repeat the same request and parse pattern. A new HTTP client is created for every segment (`traffic.py:182`). (Code review)
35. **Three copies of the same tile config.** `getMapTileConfig()` is recomputed in three components (`route-map-preview.tsx:69` and two others). (Code review)
36. **Unused code and config.** The early return at `traffic.py:165` is unreachable from the current caller. `PREDICTION_CACHE_TTL` (`config.py:46`) is never used. (Code review and services review)
37. **Unstable incident IDs.** IDs are built from list position (`live-inc-{idx+1}`, `incident.py:230`), so React lists and selection can jump on refresh. (Code review)
38. **Other frontend issues.** Route selection is not reset when origin or destination changes (`routes/page.tsx:50`). The CSV export in `analytics/page.tsx:49` does not escape quotes. Error text hardcodes "port 8000". `healthCheck` and `clearChatConversation` do not check `res.ok` (`client.ts:140-142, 189-190`). (Frontend review)
39. **Timezone is off by 30 minutes.** Hour-of-day uses UTC+5 instead of IST (+5:30) in `traffic.py:94`, `incident.py:97`, `weather.py:34`, `prediction.py:68` and `alerts.py:25`. (Services review)
40. **Weather live path is a stub.** `weather.py:95-103` always returns demo weather. (Services review)
41. **Single shared preferences object.** `user.py:85-87` writes one global preferences object for every client, with no validation error handling. (Services review)
42. **500 errors may lack CORS headers.** The request-logging middleware is added before CORS (`main.py:28`), so an unhandled exception can return a 500 without CORS headers, and the browser shows a CORS error instead (*inferred*, API review).

## Deployment, Docker and docs (second pass)

43. **Frontend API URL defaults to localhost in deployed builds.** `client.ts:16` falls back to `http://localhost:8000`, and the same default is baked in at `Dockerfile:9`, `frontend/Dockerfile:10` and `docker-compose.yml:26, 30`. The browser calls this URL directly, so on Vercel or any remote host every API call fails. The Vercel rewrites already route `/api` on the same host, so the client could use relative paths. (Entrypoint and Vercel review)
44. **Frontend TomTom key never reaches the Docker build.** `map-config.ts:16` reads `NEXT_PUBLIC_TOMTOM_API_KEY`, but `frontend/Dockerfile` only declares `NEXT_PUBLIC_API_URL`, and neither the root `Dockerfile` nor `docker-compose.yml` mentions the TomTom key. A containerized build gets an empty map key. (Env audit, checked by grep)
45. **README route example has the wrong request body.** `README.md:491` says the body is `RouteRequest` (origin, destination, avoid_congestion). The real schema (`schemas.py:134-141`) takes `origin_lat`, `origin_lng`, `destination_lat`, `destination_lng`, and optional fields. Following the README gives a 422. Checked against the schema. (README review)
46. **Run guide Docker step uses a folder that does not exist.** `run.md:155` does `cd /Users/shashwat./Desktop/project-class`. The repo is at `Desktop/Github/TrafficSense-AI`. (Run guide review)
47. **Run guide overwrites the keys file.** `run.md:159-160` runs `cp backend/.env.example backend/.env`, which would wipe keys added later. Should only copy when the file does not exist. (Run guide review)
48. **Node version requirement is too low.** `run.md:14` says Node 18.18+, and the README gives no version at all. The frontend uses Next 16, and the Dockerfiles pin Node 20. Not confirmed from installed packages. (Run guide and README reviews)
49. **"Lint" step only builds.** The section at `run.md:190-191` is titled "Build & Lint" but runs only `npm run build`. (Run guide review)
50. **README overclaims.** It says "All 12 routes static and prerendered" (`README.md:547`), but there are 9 pages. It says the unified image runs "Next.js static output" (`README.md:561`), but the entrypoint runs `npm start`, a Next server. (README review)
51. **Undocumented variables.** Frontend `NEXT_PUBLIC_TOMTOM_API_KEY` and `NEXT_PUBLIC_APP_ENV` (the latter is never read by code) and the `aws.md` credential fallback are not in the run guide or README config tables. (Run guide and env reviews)
52. **Config variables that do nothing.** `DEBUG`, `DEFAULT_LAT`, `DEFAULT_LNG`, `DEFAULT_RADIUS_KM`, `PREDICTION_CACHE_TTL`, `API_MAX_RETRIES` and `CHATBOT_REQUEST_TIMEOUT` are defined in `config.py` but never read. Several other variables with defaults are missing from `backend/.env.example`. (Env review)
53. **Entrypoint readiness.** `docker-entrypoint.sh:15` waits a fixed 2 seconds for the backend before starting the frontend. The supervisor loop and signal handling are correct. (Entrypoint review)
54. **Backend Docker ignore gaps.** `backend/.dockerignore` uses `__pycache__/` and `*.pyc`, which match only at the top level, so nested cache files are copied. Its `aws.md` and `**/*.credentials` rules are also missing. The root build does not read subdirectory ignore files at all. (Docker review)
55. **Images run as root and use unpinned base images.** None of the three Dockerfiles sets a `USER`, and base images use floating tags. `Dockerfile:35` runs an unpinned `curl … | bash` as root. (Docker review)

Verified correct: compose healthcheck URLs and ports match real routes; `/api/v1/health`, `/docs` and `/redoc` exist; `vercel.json` rewrites match the backend routes; the frontend page routes exist.

## Checked and fine

- Congestion calculation clamps values and guards `ffs <= 0` (`traffic.py:23-28`).
- Route unit handling in demo and live modes (`route.py:98-99, 164-170`).
- Cache key handling in traffic, incident, weather and analytics.
- Chatbot exception mapping (`chatbot.py:172-206`).
- `ChatRequest` bounds message length to 1-2000 characters.
- `.gitignore` excludes `.env`, `.env.local`, `.env.production`, `aws.md` and `*.credentials`. No real secrets are in tracked files or git history. The one secret-looking line in `run.md:72` looks like a placeholder (the value does not match the AWS key format).
- CORS origins come from config and default to localhost.
- `docker-entrypoint.sh` contains no secrets, and its supervisor loop is sound.
- Backend test suite: 22 passed locally (Python 3.14 venv).
