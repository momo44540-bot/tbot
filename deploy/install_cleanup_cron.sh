#!/bin/bash
set -euo pipefail

SCRIPT_PATH=/opt/trading-bot/deploy/cleanup.sh
CRON_LINE="0 3 * * 0 $SCRIPT_PATH >> /var/log/trading-bot-cleanup.log 2>&1"

mkdir -p /opt/trading-bot/deploy
cp "$(dirname "$0")/cleanup.sh" "$SCRIPT_PATH"
chmod +x "$SCRIPT_PATH"

(crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "$CRON_LINE") | crontab -

echo "==> Weekly cleanup cron installed (runs every Sunday 03:00 UTC)"
echo "==> Current root crontab:"
crontab -l
