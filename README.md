# F1 Analytics Pro — Live Stats & Predictions

A full-stack F1 Analytics & Career Tracker dashboard built with a **Django REST Framework** backend, and a **React + Vite + TypeScript + Tailwind CSS** frontend. It replicates the premium dark-glassmorphism visual language of F1 dashboards and is powered by live 2026 current-season data via the Jolpica F1 API (Ergast-compatible) and FastF1.

---

## Project Structure

```
f1-analytics/
├── backend/            # Django REST Framework backend
│   ├── f1_backend/     # Main settings and routing
│   ├── core/           # Shared models & utilities
│   ├── seasons/        # DB Models (Races, Results, Standings, etc.)
│   ├── f1data/         # Sync engine connecting to Jolpica & FastF1
│   ├── predictions/    # Championship calculators & estimators
│   └── api/            # API endpoints & views
├── frontend/           # React + Vite + TypeScript + Tailwind frontend
├── start.ps1           # Windows one-command startup script
├── start.sh            # Linux/macOS one-command startup script
└── README.md           # Setup and usage guide
```

---

## Features Replicated
1. **Season Overview**: Interactive driver/constructor standings grids with custom SVG charts detailing progression.
2. **Profiles**: Driver and constructor detail cards featuring historic timelines, performance indicators, and averages.
3. **Race Details View**: Visual representation of qualifying and race finishes, including tyre compounds sequences and pit stop counts loaded via FastF1.
4. **Predictions & Championship Tools**:
   - **Championship Scenarios**: Dynamic calculations showing points required in remaining rounds to secure titles.
   - **Points Projection**: Average pace extrapolations with +/-5% modifier thresholds.
   - **Title Decider**: Mathematical elimination tracker.
   - **Win Probability**: Current win-rate percentage projections (conservative/realistic/optimistic).
5. **Driver H2H**: Direct side-by-side comparison.
6. **Data Editor**: Inline grid updating allowing admins to override standings details after logging in.

---

## One-Command Quickstart

### On Windows
Run the PowerShell script from the root directory:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start.ps1
```
This script will build the python virtual environment, install requirements, run migrations, seed initial data for the current season, and launch both dev servers in separate windows.

### On macOS / Linux (or Git Bash)
Run the shell script:
```bash
chmod +x start.sh
./start.sh
```

---

## Manual Fallback Setup

If you prefer to start the servers manually, follow these steps:

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:
* **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
* **Windows (Cmd)**: `.venv\Scripts\activate.bat`
* **Linux/macOS**: `source .venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

Run database migrations:
```bash
python manage.py migrate
```

Create the default admin superuser (used for the frontend Data Editor):
```bash
# Set DJANGO_SETTINGS_MODULE environment variable first
# On Windows (PowerShell):
$env:DJANGO_SETTINGS_MODULE='f1_backend.settings'
# On Linux/macOS:
export DJANGO_SETTINGS_MODULE='f1_backend.settings'

python -c "import django; django.setup(); from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')"
```

Seed/Sync current-season F1 data:
```bash
python manage.py sync_season_data --year 2026
```

Start the Django backend dev server:
```bash
python manage.py runserver 8000
```

### 2. Frontend Setup
Open a new terminal window and navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev -- --port 5173
```

Now browse to `http://localhost:5173`.

---

## Data Synchronization

The backend comes with a management command `sync_season_data` which handles synchronization:
* **Initial seeding**: Pulls the 2026 calendar, constructors, and drivers from Jolpica.
* **Results**: Pulls qualifying lists and race finish results.
* **FastF1 enrichment**: Connects to the official F1 timing API in the background using the Python `fastf1` library, parsing and storing tyre compounds used (e.g. `S-M-H`) and pit stop counts per driver, caching downloaded sessions into `fastf1_cache/`.

You can trigger syncing manually via:
* CLI command: `python manage.py sync_season_data --year 2026`
* UI: Click **Sync Live Data** in the top navbar.

---

## Data Editor Login Credentials
To edit qualifying grid slots, race positions, points, or statuses manually:
1. Click **Edit Data** in the top-right corner.
2. Enter the default credentials:
   - **Username**: `admin`
   - **Password**: `admin`
3. Make changes directly in the input fields; they will save to the database in real time.
