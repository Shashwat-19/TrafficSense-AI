# Running TrafficSense AI: Complete Step-by-Step Guide

This guide walks you through setting up and running the entire **TrafficSense AI** platform — including the **FastAPI Backend**, the **Next.js Frontend**, and the integrated **AWS Bedrock AI Traffic Assistant**.

---

## 📋 Prerequisites

Ensure you have the following installed on your system:

| Tool | Minimum Version | Check Command |
|---|---|---|
| **Python** | 3.11+ | `python3 --version` |
| **Node.js** | 18.18+ (20+ recommended) | `node -v` |
| **npm** | 9+ | `npm -v` |
| **Docker** *(optional)* | 20+ | `docker --version` |
| **AWS Account** *(for AI Chatbot)* | Bedrock access enabled | (Amazon Nova Lite `amazon.nova-lite-v1:0` in `us-east-1`) |

---

## 🚀 Quick Run (Local Development)

Running both services in two separate terminals enables full hot-reloading for rapid development.

### Step 1: Start the Backend (Terminal 1)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (Command Prompt):**
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   If you haven't created a `.env` file yet, copy from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and configure your credentials:
   ```env
   # Application environment
   APP_ENV=development
   CORS_ORIGINS=http://localhost:3000,http://localhost:8000

   # Optional Live Data APIs (leave blank to run in simulated DEMO mode)
   TOMTOM_API_KEY=
   OPENWEATHER_API_KEY=

   # AI Chatbot (AWS Bedrock)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
   ```
   *(Note: You can also use credentials configured via `aws configure` in `~/.aws/credentials`)*

5. **(Optional) Train or retrain ML model:**
   A pre-trained model artifact is included at `app/models/artifacts/xgb_speed_model.pkl`. To retrain:
   ```bash
   python train_model.py
   ```

6. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

7. **Verify the backend:**
   - **Health check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Step 2: Start the Frontend (Terminal 2)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure frontend environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   Verify that `frontend/.env.local` contains:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   👉 Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🤖 Using the AI Traffic Assistant

The AI Assistant is accessible directly within the web application:

1. In the left sidebar, click on **AI Assistant** or navigate to **[http://localhost:3000/chat](http://localhost:3000/chat)**.
2. You can ask natural-language questions such as:
   - *"How is traffic on Outer Ring Road right now?"*
   - *"What is the traffic prediction for 30 minutes ahead?"*
   - *"Find me the best route from Koramangala to Whitefield avoiding congestion."*
   - *"What is the weather and are there any active accidents?"*
   - *"Give me an overview of traffic analytics and bottlenecks in Bangalore."*
3. The chatbot uses **AWS Bedrock Converse API** with tool calling to query live/demo traffic data, predictions, routes, and incident services in real-time.
4. **Context Memory:** The chatbot preserves conversation context, allowing natural follow-ups like *"What about 30 minutes from now?"*

You can also test the Chatbot API directly using `curl`:
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How is traffic on Outer Ring Road?"}'
```

---

## 🐳 Option 2: Run with Docker Compose

To launch both the backend and frontend simultaneously inside Docker containers:

1. **From the project root directory:**
   ```bash
   cd /Users/shashwat./Desktop/project-class
   ```

2. **Ensure backend `.env` is configured:**
   ```bash
   cp backend/.env.example backend/.env
   # Add your AWS credentials and optional API keys in backend/.env
   ```

3. **Build and start containers:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

5. **Stop containers:**
   ```bash
   docker-compose down
   ```

---

## 🧪 Running Automated Tests

### 1. Backend Test Suite (Pytest)
Runs all 22 tests covering core services, predictions, routes, analytics, chatbot tools, conversation memory, and API endpoints:
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### 2. Frontend Production Build & Lint
Ensures all static routes, TypeScript types, and UI components compile with zero errors:
```bash
cd frontend
npm run build
```

---

## 🌐 Application Sitemap

| View | URL Path | Description |
|---|---|---|
| **Dashboard** | `/` | Real-time congestion KPIs, active incident counts, average city speed, weather widget, top congested roads, and recent alerts. |
| **Traffic Map** | `/map` | Interactive Bangalore Leaflet map showing 25 monitored road segments (color-coded by congestion) and live incident markers. |
| **Analytics** | `/analytics` | Recharts charts: Congestion distribution pie chart, 24-hour speed/congestion trends, top bottlenecked corridors, and free-flow comparisons. |
| **Predictions** | `/predictions` | XGBoost ML speed and congestion predictions across 15, 30, and 60-minute horizons. |
| **Route Planner** | `/routes` | Multi-alternative route analysis between Bangalore key hubs with congestion-avoidance routing. |
| **Incidents** | `/incidents` | Categorized list of accidents, roadworks, and closures with filter controls by severity and incident type. |
| **Alerts** | `/alerts` | Alert notification feed with read/unread toggles and urgency classifications (Critical, Warning, Info). |
| **AI Assistant** | `/chat` | Integrated conversational AI chatbot with real-time tool calling, conversation history, and quick prompts. |
| **Settings** | `/settings` | System health status, live/demo mode indicator, saved locations, recent trip queries, and display preferences. |

---

## ⚙️ Configuration Options

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `TOMTOM_API_KEY` | *(empty)* | Optional TomTom API key for live traffic flow |
| `OPENWEATHER_API_KEY` | *(empty)* | Optional OpenWeather key for live weather data |
| `APP_ENV` | `development` | Environment mode (`development` or `production`) |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:8000` | Allowed origins |
| `AWS_REGION` | `us-east-1` | AWS region for Bedrock |
| `AWS_ACCESS_KEY_ID` | *(empty)* | AWS access key for Bedrock |
| `AWS_SECRET_ACCESS_KEY` | *(empty)* | AWS secret key for Bedrock |
| `BEDROCK_MODEL_ID` | `amazon.nova-lite-v1:0` | Amazon Bedrock model ID |
| `CHATBOT_MAX_HISTORY` | `20` | Max messages stored in conversation memory window |

---

## ❓ Troubleshooting

### 1. Port 8000 or 3000 already in use
If a process is already running on port 8000 or 3000:
- **Free port 8000:**
  ```bash
  lsof -ti:8000 | xargs kill -9
  ```
- **Free port 3000:**
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### 2. Chatbot reports "AI service is not configured"
- Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are populated in `backend/.env`.
- Ensure your IAM user has permissions for `bedrock:InvokeModel` and `bedrock:Converse`.
- Verify model access for **Amazon Nova Lite** in the AWS Bedrock console in `us-east-1`.

### 3. Frontend fails to fetch backend data
- Ensure backend is running at `http://localhost:8000`.
- Verify `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- Test backend health directly: `curl http://localhost:8000/api/v1/health`.
