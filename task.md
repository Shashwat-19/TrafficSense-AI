# TrafficSense AI — Full Repository Audit, Testing, Bug Fixing & Stabilization

You are Google Jules acting as a senior/principal software engineer, ML engineer, backend engineer, frontend engineer, QA engineer, and cloud engineer.

Repository:

https://github.com/Shashwat-19/TrafficSense-AI

Project:

TrafficSense AI — a cloud-based intelligent traffic monitoring, prediction, analytics, route-planning, incident/alert monitoring, weather-aware platform with an integrated AI traffic assistant.

Your task is to thoroughly inspect this repository, run the application and tests, identify actual bugs/issues, fix them, and leave the repository in a stable, working state.

IMPORTANT:

Do NOT assume the code is broken.

Do NOT rewrite the project unnecessarily.

First inspect and understand the existing implementation.

Use the existing architecture whenever possible.

Your goal is:

AUDIT → RUN → TEST → IDENTIFY → FIX → VERIFY → DOCUMENT

---

# 1. REPOSITORY AUDIT

Start by inspecting the entire repository.

Check:

- README.md
- run.md
- task.md
- app.py
- backend/
- frontend/
- docker-compose.yml
- Dockerfiles
- environment examples
- tests
- ML artifacts
- configuration
- API routes
- frontend pages
- shared components
- chatbot implementation
- chatbot tools
- database/storage logic

Create a mental map of the project before editing anything.

Pay special attention to:

backend/app/main.py

backend/app/api/

backend/app/services/

backend/app/models/

backend/tests/

frontend/src/app/

frontend/src/components/

frontend/src/lib/

app.py

---

# 2. CURRENT EXPECTED ARCHITECTURE

The intended architecture is:

User
↓
Next.js Frontend
↓
FastAPI Backend
↓
Traffic / Weather / Incident / Route / Analytics / Prediction Services
↓
External APIs + ML Model + Storage

The AI assistant should use the SAME backend services.

Do not duplicate business logic.

The chatbot must not become a second independent traffic system.

---

# 3. APPLICATIONS TO VERIFY

Verify every major user-facing page:

/

Dashboard

/map

Traffic Map

/analytics

Analytics

/predictions

Predictions

/routes

Route Planner

/incidents

Incidents

/alerts

Alerts

/chat

AI Assistant

/settings

Settings

Every page should:

- load
- render correctly
- communicate with the backend
- handle loading
- handle errors
- handle empty states
- not contain broken links
- not throw browser console errors
- not contain dead buttons
- not crash when APIs fail

---

# 4. BACKEND AUDIT

Inspect the FastAPI backend.

Check:

- application startup
- route registration
- dependency loading
- environment handling
- Pydantic validation
- service architecture
- exception handling
- CORS
- API responses
- status codes
- async/sync usage
- logging
- configuration

Verify:

GET /api/v1/health

and all other registered API endpoints.

Use Swagger:

/docs

and verify that documented endpoints actually work.

---

# 5. TRAFFIC SERVICE

Audit:

backend/app/services/traffic.py

Check:

- API requests
- timeout handling
- response validation
- missing fields
- invalid provider responses
- congestion calculation
- stale data handling
- demo mode
- caching
- coordinates
- road-segment mapping
- timestamps

Ensure no fake traffic is accidentally presented as live data.

If DEMO mode exists:

Clearly identify DEMO mode in the UI.

Do not silently mix demo and live data.

---

# 6. WEATHER SERVICE

Audit weather integration.

Check:

- API key handling
- location handling
- response validation
- missing values
- timeout
- invalid API response
- fallback behavior
- UI display

Verify that frontend weather values actually originate from the backend.

---

# 7. INCIDENT SYSTEM

Audit:

backend/app/services/incident.py

and:

frontend incident pages.

Verify:

- incident loading
- filtering
- severity
- location
- timestamps
- map integration
- empty state
- DEMO/live separation

Make sure incident information does not crash the map.

---

# 8. ALERT SYSTEM

Audit:

backend/app/services/alerts.py

and:

frontend/src/app/alerts/

Verify:

- alert retrieval
- unread/read behavior
- severity
- timestamps
- alert counts
- UI synchronization
- refresh behavior

Check whether the alert count can become inconsistent with actual data.

Fix any state-management bugs.

---

# 9. ROUTE PLANNER

Audit:

backend/app/services/route.py

and:

frontend/src/app/routes/

Verify:

- origin selection
- destination selection
- validation
- route calculation
- multiple route results
- congestion information
- travel time
- delay
- map visualization if implemented
- avoid-high-congestion option

Check for:

- hardcoded route results
- invalid assumptions
- incorrect calculations
- broken UI state
- routes that do not correspond to the selected origin/destination

If DEMO mode is intentional, make that explicit.

---

# 10. ANALYTICS

Audit:

backend/app/services/analytics.py

and:

frontend/src/app/analytics/

Verify:

- congestion calculations
- average speed
- segment count
- incidents
- hourly pattern
- top congested roads
- free-flow comparison
- chart rendering
- empty datasets
- division-by-zero problems
- invalid aggregation
- inconsistent numbers between dashboard and analytics

IMPORTANT:

The same source data should produce consistent metrics across dashboard, analytics, map and predictions.

Look specifically for contradictory values.

---

# 11. MACHINE LEARNING

Audit:

backend/app/services/prediction.py

backend/train_model.py

backend/app/models/artifacts/

Check:

- model loading
- missing artifact handling
- model compatibility
- input feature ordering
- preprocessing consistency
- prediction horizon
- output validation
- confidence calculation
- congestion classification
- error handling

Verify that the model artifact actually matches the feature schema expected by inference.

Check for:

- data leakage
- incorrect feature names
- wrong ordering
- NaN values
- impossible predictions
- negative speeds
- inconsistent units

Do not retrain the model unless necessary.

If the existing model is valid, preserve it.

---

# 12. CHATBOT

Audit the integrated chatbot.

Inspect:

app.py

backend/app/services/chatbot.py

backend/app/services/chatbot_tools.py

frontend/src/app/chat/

Verify:

- AWS Bedrock configuration
- model configuration
- tool calling
- traffic tool
- prediction tool
- weather tool
- incident tool
- route tool
- analytics tool
- conversation memory
- context handling
- error handling
- missing credentials
- frontend/backend communication

Test actual questions such as:

"How is traffic on Outer Ring Road?"

"What about 30 minutes from now?"

"Are there any incidents near Silk Board?"

"What's the weather in Bangalore?"

"Find a less congested route from Electronic City to Hebbal."

The chatbot must obtain factual data from backend services.

It must not fabricate live traffic information.

---

# 13. CHATBOT SECURITY

Audit for:

- prompt injection
- arbitrary tool execution
- shell execution
- filesystem access
- credential leakage
- unsafe user input
- unrestricted model actions
- excessive permissions

The LLM must not be able to execute arbitrary OS commands.

Tools must have explicit schemas and limited capabilities.

---

# 14. FRONTEND QUALITY

Check the entire frontend for:

- TypeScript errors
- ESLint errors
- hydration issues
- missing keys
- unnecessary re-renders
- broken client/server boundaries
- invalid hooks
- memory leaks
- improper async handling
- broken responsive layout
- inaccessible controls
- inconsistent state

Run:

npm run build

and any available lint/test commands.

Fix all genuine errors.

---

# 15. BROWSER CONSOLE

Run the application and inspect browser console errors.

Fix:

- React warnings
- hydration mismatch
- failed API calls
- undefined values
- failed network requests
- unhandled promise rejections
- invalid DOM nesting
- missing resources

Do not ignore console errors simply because the UI appears visually correct.

---

# 16. API / FRONTEND CONTRACT

Compare frontend API calls with backend API definitions.

Look for:

- mismatched field names
- mismatched data types
- wrong endpoints
- wrong HTTP methods
- incorrect query parameters
- incorrect response parsing
- optional fields assumed to exist
- stale API contracts

This is a high-priority audit.

---

# 17. ENVIRONMENT VARIABLES

Inspect:

backend/.env.example

frontend/.env.local.example

Verify every required environment variable is:

- documented
- correctly named
- actually used
- not hardcoded
- not exposed unnecessarily

Verify no secrets exist in source code.

Search the repository for:

- API keys
- AWS secrets
- tokens
- passwords
- private credentials

Do NOT print secret values in your final report.

---

# 18. CORS

Verify CORS for:

localhost:3000

localhost:8000

and any configured deployment origins.

Development mode may allow the local frontend.

Production must use explicit origins.

Do not blindly use:

allow_origins=["*"]

unless there is a documented reason.

---

# 19. DOCKER

Audit:

docker-compose.yml

backend/Dockerfile

frontend/Dockerfile

Verify:

- build succeeds
- containers start
- frontend can reach backend
- environment variables are passed correctly
- ports are correct
- health endpoint works

Run:

docker compose build

and:

docker compose up

if Docker is available.

Fix real issues.

---

# 20. TEST SUITE

Run:

cd backend
pytest tests/ -v

Run the complete test suite.

Do not stop at the first failure.

Classify failures:

- real code bug
- missing dependency
- configuration problem
- environment problem
- outdated test
- external API failure

Fix actual code problems.

Do not modify tests merely to make them pass unless the test itself is demonstrably incorrect.

---

# 21. FRONTEND BUILD

Run:

cd frontend
npm install

Then:

npm run build

and lint if configured.

Resolve:

- TypeScript failures
- module errors
- missing imports
- invalid props
- runtime build failures

---

# 22. END-TO-END TEST

Perform an actual end-to-end test:

1. Start backend.
2. Verify `/api/v1/health`.
3. Start frontend.
4. Open dashboard.
5. Open traffic map.
6. Open analytics.
7. Open predictions.
8. Open routes.
9. Open incidents.
10. Open alerts.
11. Open chatbot.
12. Send an actual chatbot request.
13. Verify backend interaction.
14. Refresh the application.
15. Confirm application remains stable.

---

# 23. DATA CONSISTENCY AUDIT

Cross-check:

Dashboard
vs
Map
vs
Analytics
vs
Predictions
vs
Incidents
vs
Alerts
vs
Chatbot

The same road should not show contradictory traffic states without a valid timestamp/reason.

For example:

If the dashboard says:

80% congestion

while analytics says:

45%

determine whether both are calculated differently.

Fix genuine inconsistencies.

---

# 24. DEMO MODE

The repository appears to support DEMO mode.

Verify that:

- DEMO mode works without API credentials
- DEMO mode is visibly labeled
- live mode is visibly different
- DEMO values do not accidentally appear as live data
- chatbot responses correctly understand whether data is live or demo

Do not remove DEMO mode unless it is genuinely broken and unnecessary.

---

# 25. PERFORMANCE

Check obvious performance issues:

- duplicate API requests
- excessive polling
- repeated model loading
- repeated external API calls
- expensive frontend rerenders
- unnecessary large payloads
- charts rendering excessively large datasets

Do not optimize prematurely.

Fix actual performance problems.

---

# 26. CODE QUALITY

Look for:

- duplicate logic
- dead code
- unused imports
- unused variables
- giant functions
- duplicated API clients
- inconsistent types
- poor error handling
- hardcoded configuration
- magic numbers

Refactor only where it meaningfully improves correctness or maintainability.

Do not rewrite working modules simply for stylistic preference.

---

# 27. DOCUMENTATION

Update documentation only where necessary.

README.md should accurately describe:

- architecture
- installation
- environment variables
- backend
- frontend
- ML
- chatbot
- DEMO mode
- testing
- Docker
- troubleshooting

If documentation contains commands that no longer work, correct them.

---

# 28. GIT SAFETY

Before modifying anything:

Check git status.

Do not overwrite unrelated uncommitted user changes.

Do not delete files unless genuinely necessary.

Do not remove working functionality.

Keep changes focused and explainable.

---

# 29. FIX PRIORITY

Use this priority:

P0 — application cannot start
P1 — broken core functionality
P2 — incorrect data / incorrect calculations
P3 — integration failures
P4 — UI/UX bugs
P5 — code-quality improvements

Always fix P0/P1/P2 before cosmetic changes.

---

# 30. DEFINITION OF DONE

The task is complete only when:

[ ] Backend starts
[ ] Frontend starts
[ ] Health endpoint works
[ ] Frontend build succeeds
[ ] Backend tests pass
[ ] Traffic service works
[ ] Traffic map works
[ ] Analytics works
[ ] Predictions work
[ ] Route planner works
[ ] Incidents work
[ ] Alerts work
[ ] Weather works
[ ] Chatbot loads
[ ] Chatbot can answer real traffic queries
[ ] Chatbot tool calling works
[ ] Conversation context works
[ ] Demo mode works
[ ] No exposed secrets
[ ] No critical browser console errors
[ ] Docker build works if Docker is available
[ ] README/run instructions are accurate

Do NOT claim completion unless these checks have actually been performed.

---

# 31. FINAL REPORT

At the end provide a concise engineering report:

## Repository Audit
What was inspected?

## Bugs Found
For each bug:

- file
- problem
- root cause
- fix

## Features Verified
List working modules.

## Tests
Include exact commands and results.

## Build
Frontend build result.

## Backend
Startup and health-check result.

## Chatbot
Chatbot test result.

## Docker
Docker result if tested.

## Security
Any issues found/fixed.

## Remaining Issues
Only genuine unresolved issues.

## Recommended Next Steps
Only if necessary.

IMPORTANT:

Do not report something as "verified" unless you actually ran it.

Do not hide failures.

Do not fabricate test results.

The goal is to leave TrafficSense AI genuinely more stable, correct, secure and maintainable than it was before the audit.