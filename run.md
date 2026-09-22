# Running TrafficSense AI: Complete Step-by-Step Guide

This guide walks you through setting up and running both the **FastAPI Backend** and the **Next.js 15 Frontend** locally or via Docker.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your system:

| Tool | Minimum Version | Check Command |
|---|---|---|
| **Python** | 3.11+ | `python3 --version` |
| **Node.js** | 18.18+ (20+ recommended) | `node -v` |
| **npm** | 9+ | `npm -v` |
| **Docker** *(optional)* | 20+ | `docker --version` |

---

## 🚀 Option 1: Local Development (Recommended)

Running the services locally in separate terminal windows gives you live hot-reloading for both backend and frontend.

### Step 1: Start the Backend (Terminal 1)

1. **Navigate to the backend directory:**
   ```bash
   cd /Users/shashwat./Desktop/project-class/backend
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

3. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up the environment file:**
   ```bash
   cp .env.example .env
   ```
   > 💡 **Note on Demo Mode:** You do **not** need API keys to run the application. If `TOMTOM_API_KEY` and `OPENWEATHER_API_KEY` are left blank, TrafficSense AI automatically operates in **DEMO mode** with realistic, time-varying Bangalore traffic simulation and trained ML predictions.

5. **(Optional) Train or re-train the XGBoost ML model:**
   A pre-trained model artifact is already provided at `app/models/artifacts/xgb_speed_model.pkl`. If you wish to retrain it:
   ```bash
   python train_model.py
   ```

6. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

7. **Verify backend is running:**
   - Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - Interactive Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Step 2: Start the Frontend (Terminal 2)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd /Users/shashwat./Desktop/project-class/frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Set up the local environment file:**
   ```bash
   cp .env.local.example .env.local
   ```
   *By default, this points `NEXT_PUBLIC_API_URL` to `http://localhost:8000`.*

4. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

5. **Open the web dashboard in your browser:**
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🐳 Option 2: Run with Docker Compose (Single Command)

If you have Docker and Docker Compose installed, you can launch the entire stack (Backend + Frontend) together:

1. **From the project root directory:**
   ```bash
   cd /Users/shashwat./Desktop/project-class
   ```

2. **Ensure backend `.env` exists:**
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Build and launch containers:**
   ```bash
   docker-compose up --build
   ```

4. **Access the services:**
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

5. **To stop the containers:**
   ```bash
   docker-compose down
   ```

---

## 🧪 Running Automated Tests

### 1. Backend Pytest Suite
Test all 15 endpoints, ML prediction schemas, and error handling:
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### 2. Frontend Production Build & Type-Check
Verify strict TypeScript compilation, ESLint rules, and static route generation:
```bash
cd frontend
npm run build
```

---

## 🌐 Application Page Sitemap

Once the frontend is running at [http://localhost:3000](http://localhost:3000), you can explore the following pages via the sidebar navigation:

| Page | URL Path | What It Does |
|---|---|---|
| **Dashboard** | `/` | Real-time congestion KPIs, active incident counts, average city speed, weather widget, top congested roads list, and recent alert feeds. |
| **Traffic Map** | `/map` | Interactive Bangalore Leaflet map showing 25 monitored road segments (color-coded by congestion) and live incident markers with interactive popups. |
| **Analytics** | `/analytics` | Visualizations using Recharts: Congestion distribution pie chart, 24-hour speed/congestion trends, top bottlenecked corridors, and free-flow speed comparisons. |
| **Predictions** | `/predictions` | XGBoost machine learning speed and congestion forecasts across 15, 30, and 60-minute horizons. |
| **Route Planner** | `/routes` | Multi-alternative route analysis between Bangalore key hubs (Koramangala, Indiranagar, Electronic City, Whitefield, Airport, Silk Board, etc.) with congestion avoidance. |
| **Incidents** | `/incidents` | Categorized list of accidents, roadworks, and closures with filter controls by severity and incident type. |
| **Alerts** | `/alerts` | Alert notification feed with read/unread toggles and urgency classifications (Critical, Warning, Info). |
| **Settings** | `/settings` | System health status, live/demo mode indicator, user saved locations, recent trip histories, and map unit preferences. |

---

## ⚙️ Configuration & Live Mode Setup

### Switching to Live Data (TomTom & OpenWeather)
To enable live traffic and weather instead of mock data:
1. Open `backend/.env`
2. Add your API keys:
   ```env
   TOMTOM_API_KEY=your_actual_tomtom_api_key_here
   OPENWEATHER_API_KEY=your_actual_openweather_api_key_here
   ```
3. Restart the backend server. The UI will automatically switch the badge from `● DEMO` to `● LIVE`.

---

## ❓ Troubleshooting

- **Port 8000 or 3000 already in use:**
  - Find what process is using the port:
    ```bash
    lsof -i :8000
    lsof -i :3000
    ```
  - Kill the process or launch on an alternative port:
    ```bash
    uvicorn app.main:app --port 8001
    # and update NEXT_PUBLIC_API_URL in frontend/.env.local accordingly
    ```

- **Frontend cannot connect to Backend:**
  - Ensure the backend is active at `http://localhost:8000`.
  - Check that `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000`.
  - Verify backend health at `curl http://localhost:8000/api/v1/health`.
