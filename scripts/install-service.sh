#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

sudo cp "$PROJECT_DIR/pr-dashboard.service" /etc/systemd/system/pr-dashboard.service
sudo systemctl daemon-reload
sudo systemctl enable pr-dashboard
sudo systemctl start pr-dashboard

echo "Service installed and started."
echo "Check status: sudo systemctl status pr-dashboard"
