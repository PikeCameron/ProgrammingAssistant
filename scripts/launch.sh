#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start the server via systemd if available, otherwise run directly
if systemctl is-active --quiet pr-dashboard 2>/dev/null; then
  : # already running
elif systemctl list-units --full -all 2>/dev/null | grep -q pr-dashboard; then
  sudo systemctl start pr-dashboard
  sleep 2
else
  # systemd service not installed — start the process directly in background
  cd "$PROJECT_DIR"
  nohup node dist/server/index.js >> /tmp/pr-dashboard.log 2>&1 &
  sleep 2
fi

chromium-browser --app=http://localhost:3000 --disable-infobars --noerrdialogs
