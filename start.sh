#!/bin/bash
# F1 Analytics Pro Unix Startup Script

echo "================================================"
echo "   F1 Analytics Pro Setup & Startup Script      "
echo "================================================"

# Setup backend venv and packages
echo -e "\n[1/5] Setting up Python virtual environment..."
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
echo -e "\n[2/5] Running database migrations..."
python manage.py migrate

# Create default superuser
echo -e "\n[3/5] Creating default superuser (admin/admin)..."
DJANGO_SETTINGS_MODULE='f1_backend.settings' python -c "import django; django.setup(); from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')"

# Run first sync
echo -e "\n[4/5] Running F1 data sync for season 2026..."
python manage.py sync_season_data --year 2026

# Start backend dev server
echo -e "\n[5/5] Launching Django backend on port 8000..."
python manage.py runserver 8000 &
BACKEND_PID=$!

# Setup and start frontend
echo -e "\nSetting up React frontend..."
cd ../frontend
npm install

echo -e "\nLaunching Vite frontend on port 5173..."
npm run dev -- --port 5173 &
FRONTEND_PID=$!

# Trap signals to kill both processes on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "================================================"
echo "Startup complete! Browse http://localhost:5173 to view F1 Analytics Pro."
echo "================================================"

wait
