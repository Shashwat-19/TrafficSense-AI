# To-do

Work still to do. Details are in `reviews.md`.

## Needs you

- [ ] Add `OPENWEATHER_API_KEY` and the AWS keys to `backend/.env` if you want live weather and the chatbot.
- [ ] Restrict the browser TomTom key by domain in the TomTom dashboard.
- [ ] Decide how the API should be authenticated (every endpoint, including chat and preferences, is open).
- [ ] Decide whether to keep the 30-second Bedrock read timeout, which is shorter than boto3's default.
- [ ] Decide whether to move from Node 20 (past end of life) to Node 22 LTS.

## Verify

- [ ] Run `docker compose up --build` and a root `docker build` to confirm the new Node copy, non-root users and `next start` work. None of the Docker changes have been built, and neither has `docker-compose.override.yml.example`.
- [ ] Test the live OpenWeather path once the key is set (it is only tested with mocked responses).
- [ ] Test the AWS Bedrock chatbot once the AWS keys are set.

## Security and dependencies

- [ ] 9 high-severity advisories remain in dev-only tools (the shadcn CLI and eslint's plugin chain, through `braces`, `micromatch` and `fast-glob`). No patched release exists yet, so re-run `npm audit` later.
- [ ] Decide whether to keep the retrained `xgb_speed_model.pkl` in git and loaded by pickle, or load it from a safer format or a trusted release.

## Backend

- [ ] Share the time-of-day table between `prediction.py` and `traffic.py` instead of keeping two copies.
- [ ] Tighten cached prediction freshness by recording when the traffic data was fetched (a cached prediction can use traffic data up to one cache window old).
- [ ] Make the partial-result warning work for callers that split fetching and reading across threads, if any are added.

## Cleanup

- [ ] Keep `DEBUG` or remove it: only config and the tests read it now.
