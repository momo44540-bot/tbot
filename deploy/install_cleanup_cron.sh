#!/bin/bash
set -eu

SCRIPT_PATH=/opt/trading-bot/deploy/cleanup.sh
CRON_LINE="0 3 * * 0 $SCRIPT_PATH >> /var/log/trading-bot-cleanup.log 2>&1"

mkdir -p /opt/trading-bot/deploy
cp "$(dirname "$0")/cleanup.sh" "$SCRIPT_PATH"
chmod +x "$SCRIPT_PATH"

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" > "$TMP_CRON" || true
echo "$CRON_LINE" >> "$TMP_CRON"
crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "==> Weekly cleanup cron installed (runs every Sunday 03:00 UTC)"
echo "==> Current root crontab:"
crontab -l
