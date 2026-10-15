# To-do

Only the work that is left for you. Details are in `reviews.md`.

## Before merging

- [ ] Push `fix/code-review-fixes` to GitHub. The latest fixes (time-of-day table, prediction consistency, chat and route fixes) are committed locally only.
- [ ] Run `docker compose up --build` and confirm both containers start and healthy. None of the Docker changes (root `Dockerfile`, `frontend/Dockerfile`, `backend/Dockerfile`, `docker-compose.yml`) have been built, because Docker is not installed on the machine used for the fixes.
- [ ] Run a root `docker build -t trafficsense .` and check the unified image starts (`docker run -p 3000:3000 -p 8000:8000 --env-file backend/.env trafficsense`).
- [ ] Open the pull request for `fix/code-review-fixes` and merge it into `main`.

## Keys

- [ ] Add `OPENWEATHER_API_KEY` to `backend/.env` for live weather, then check `/api/v1/weather` shows live data.
- [ ] Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` and `BEDROCK_MODEL_ID` to `backend/.env` for the chatbot, then test a chat message.
- [ ] Create `frontend/.env.local` (copy `frontend/.env.local.example`) and set `NEXT_PUBLIC_TOMTOM_API_KEY` for map tiles. Also set `NEXT_PUBLIC_API_URL=http://localhost:8000` for local development.
- [ ] In the TomTom dashboard, restrict the browser map key to your site's domains. Use a separate key for the browser and the backend.
- [ ] Set `NEXT_PUBLIC_TOMTOM_API_KEY` as a build variable wherever you deploy the frontend (Vercel project settings).
- [ ] Set `APP_ENV=production` and the backend keys as environment variables in your deployment.

## Decisions

- [ ] Choose how to authenticate the API. Right now every endpoint is open, including chat (which costs money through AWS) and preferences.
- [ ] Decide whether to keep the 30-second chat timeout or raise it (`CHATBOT_REQUEST_TIMEOUT` in `backend/app/core/config.py`).
- [ ] Decide whether to move from Node 20 (past end of life) to Node 22 LTS in the Dockerfiles and the docs.
- [ ] Decide whether to keep the trained model file `xgb_speed_model.pkl` in git, or publish it as a release asset instead.

## Later

- [ ] Re-run `npm audit` in `frontend/` in a few weeks. 9 high-severity advisories remain in dev-only tools and no patched release exists yet.
