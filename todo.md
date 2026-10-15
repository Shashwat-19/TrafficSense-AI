# To-do

Work still to do after this round of fixes. Details are in `reviews.md`.

## Needs you

- [ ] Restrict the browser TomTom key by domain in the TomTom dashboard.
- [ ] Add `OPENWEATHER_API_KEY` and the AWS keys to `backend/.env` if you want weather and the chatbot live.
- [ ] Decide how the API should be authenticated (chat and preferences endpoints are open).
- [ ] Set `APP_ENV=production` in the Dockerfiles and compose files, so the docs pages and debug mode switch off in deployments.
- [ ] Decide whether to keep the 30-second Bedrock read timeout, which is shorter than boto3's default.

## Security and deployment

- [ ] Pass `NEXT_PUBLIC_TOMTOM_API_KEY` through `docker-compose.yml` as a build arg.
- [ ] Verify the non-root containers can write where they need to (bind-mounted `./backend` in compose).
- [ ] Pin base image versions and remove the unpinned NodeSource `curl | bash` step.
- [ ] Stop the chat `/openapi.json` endpoint being served in production.
- [ ] Remove the `README.md` quickstart step that overwrites `backend/.env` with `cp`, and the architecture table's "static shell" wording.

## Frontend

- [ ] Remove the `cn` package: point `frontend/src/lib/utils.ts` at `clsx` and `tailwind-merge`, switch the 14 files that import `cn` from it, then regenerate `package-lock.json` with `npm install`.
- [ ] Run `npm install`, then `npx tsc --noEmit` and `npm run lint` to type-check the frontend changes, which have not been verified yet.
- [ ] Make server-side fetches use an absolute URL, since the client now defaults to relative paths.
- [ ] Remove the hardcoded "Baseline 45 km/h" and invented segment counts on the analytics page.
- [ ] Replace "port 8000" in error text with the real API URL.

## Backend

- [ ] Make shared service caches thread-safe, since service calls now run on worker threads.
- [ ] Show the missing-segment list in the traffic API response, not only in the log.
- [ ] Stop caching the demo fallback for the full TTL, so recovery after a TomTom outage is faster.
- [ ] Use live data for alerts, analytics and predictions, and report the real data mode.
- [ ] Stop predictions returning the first segment for an unknown segment ID.
- [ ] Stop unresolved place names routing from city centre without an error.
- [ ] Implement the OpenWeather live path or label weather as demo everywhere.
- [ ] Use IST (+5:30) for hour-of-day calculations.
- [ ] Remove the unreachable early return in `traffic.py` and the unused `PREDICTION_CACHE_TTL`, or wire them up.
- [ ] Retrain the speed model with lag features from the previous hour, and use the validation split with early stopping.
- [ ] Load the model with a safer format than pickle, or verify its source.
- [ ] Stop returning raw exception text from chatbot tools to the model.

## Cleanup

- [ ] Share one map tile configuration across the three frontend components.
- [ ] Use stable incident IDs from the TomTom payload.
- [ ] Pin the Python version in the Docker image to match the local venv (3.14 vs 3.11).
