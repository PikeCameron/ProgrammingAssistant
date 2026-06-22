#!/usr/bin/env bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="/tmp/pr-dashboard-launch.log"

exec >> "$LOG" 2>&1
echo "--- launch $(date) ---"

# Start the server if not already running
if systemctl is-active --quiet pr-dashboard 2>/dev/null; then
  echo "systemd service already running"
elif systemctl list-unit-files pr-dashboard.service &>/dev/null; then
  echo "starting systemd service..."
  sudo systemctl start pr-dashboard
  sleep 2
else
  echo "starting node directly..."
  cd "$PROJECT_DIR"
  nohup node dist/server/index.js >> /tmp/pr-dashboard.log 2>&1 &
  sleep 2
fi

# Find the chromium binary
if command -v chromium-browser &>/dev/null; then
  CHROMIUM=chromium-browser
elif command -v chromium &>/dev/null; then
  CHROMIUM=chromium
else
  echo "ERROR: chromium not found"
  exit 1
fi

echo "opening $CHROMIUM..."
"$CHROMIUM" \
  --app=http://localhost:3000 \
  --user-data-dir=/tmp/pr-dashboard-browser \
  --disable-infobars \
  --noerrdialogs \
  --disable-gpu \
  &
