# To-do

Work still to do. Details are in `reviews.md`.

## Needs you

- [ ] Add `OPENWEATHER_API_KEY` and the AWS keys to `backend/.env` if you want live weather and the chatbot.
- [ ] Restrict the browser TomTom key by domain in the TomTom dashboard.
- [ ] Decide how the API should be authenticated (chat, preferences and all other endpoints are open).
- [ ] Decide whether to keep the 30-second Bedrock read timeout, which is shorter than boto3's default.
- [ ] Decide whether to move from Node 20 (past end of life) to Node 22 LTS.

## Verify

- [ ] Run a Docker build of the root image and `docker compose up --build` to confirm the new Node copy, non-root users and `next start` all work. None of the Docker changes have been built.
- [ ] Check that the chatbot's prediction tool handles the new unknown-segment error with a sensible message (`chatbot_tools.py`).
- [ ] Check that the frontend handles alerts now being built from live data (fewer alerts, new IDs).

## Security and dependencies

- [ ] Review the `npm audit` results (12 vulnerabilities reported: 11 high, 1 critical) and upgrade the affected packages.
- [ ] Add length limits to the saved location and recent route text fields in the preferences model.
- [ ] Decide whether to keep the retrained `xgb_speed_model.pkl` in git and loaded by pickle, or load it from a safer format or a trusted release.

## Backend

- [ ] Show the missing-segment list in the traffic API response, not only in the log (needs the endpoint's return shape to change).
- [ ] Cache partial live traffic results briefly, so persistently failing segments don't cost 25 calls per request.
- [ ] Decide whether to cache predictions, and align `PREDICTION_CACHE_TTL` with the traffic cache so current speeds stay consistent, or remove the setting.
- [ ] Feed real weather into predictions (temperature and rain are fixed placeholders now).
- [ ] Share the time-of-day table between `prediction.py` and `traffic.py` instead of keeping two copies.
- [ ] Remove the config variables nothing reads (`DEFAULT_RADIUS_KM`, `API_MAX_RETRIES`, `CHATBOT_REQUEST_TIMEOUT` may now be partly used; re-check).

## Cleanup

- [ ] Add a `docker-compose.override.yml` example file for local development (currently only documented in the README).
- [ ] Stop the build log writing to `~/.claude/build.log` outside the repo, if that comes from a project script.
