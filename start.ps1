# F1 Analytics Pro Windows Startup Script
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   F1 Analytics Pro Setup & Startup Script      " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Setup backend venv and packages
Write-Host "`n[1/5] Setting up Python virtual environment..." -ForegroundColor Green
cd backend
if (!(Test-Path .venv)) {
    python -m venv .venv
}
.venv\Scripts\pip install -r requirements.txt

# Run migrations
Write-Host "`n[2/5] Running database migrations..." -ForegroundColor Green
.venv\Scripts\python manage.py migrate

# Create default superuser
Write-Host "`n[3/5] Creating default superuser (admin/admin)..." -ForegroundColor Green
$env:DJANGO_SETTINGS_MODULE='f1_backend.settings'
.venv\Scripts\python -c "import django; django.setup(); from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')"

# Run first sync
Write-Host "`n[4/5] Running F1 data sync for season 2026..." -ForegroundColor Green
.venv\Scripts\python manage.py sync_season_data --year 2026

# Start backend dev server in a new window
Write-Host "`n[5/5] Launching Django backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .venv\Scripts\python manage.py runserver 8000"

# Setup and start frontend
Write-Host "`nSetting up React frontend..." -ForegroundColor Green
cd ../frontend
npm install

Write-Host "`nLaunching Vite frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --port 5173"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Startup complete! Browse http://localhost:5173 to view F1 Analytics Pro." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
