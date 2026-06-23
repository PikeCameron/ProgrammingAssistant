#!/usr/bin/env bash

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
export DISPLAY="${DISPLAY:-:0}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="/tmp/pr-dashboard-launch.log"

exec >> "$LOG" 2>&1
echo "--- launch $(date) ---"
echo "PATH=$PATH"
echo "DISPLAY=$DISPLAY"

# Start the server if not already running
if systemctl is-active --quiet pr-dashboard 2>/dev/null; then
  echo "systemd service already running"
elif systemctl list-unit-files pr-dashboard.service &>/dev/null; then
  echo "starting systemd service..."
  sudo systemctl start pr-dashboard
  sleep 2
else
  echo "starting node directly..."
  echo "PROJECT_DIR=$PROJECT_DIR"
  nohup node "$PROJECT_DIR/dist/server/index.js" >> /tmp/pr-dashboard.log 2>&1 &
  disown
  sleep 3
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

pkill chromium 2>/dev/null; sleep 1
rm -rf /tmp/pr-dashboard-browser 2>/dev/null
echo "opening $CHROMIUM..."
"$CHROMIUM" \
  --kiosk http://localhost:3000 \
  --user-data-dir=/tmp/pr-dashboard-browser \
  --disable-infobars \
  --noerrdialogs \
  &
disown
