#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

DESKTOP_FILE="$HOME/Desktop/pr-dashboard.desktop"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=PR Dashboard
Comment=Launch PR Dashboard
Exec=lxterminal -e bash -c 'bash $PROJECT_DIR/scripts/launch.sh'
Icon=applications-internet
Terminal=false
EOF

chmod +x "$DESKTOP_FILE"
chmod +x "$PROJECT_DIR/scripts/launch.sh"

echo "Shortcut created at $DESKTOP_FILE"
