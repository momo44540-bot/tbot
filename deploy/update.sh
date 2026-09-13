#!/bin/bash
set -e

cd ~/tbot
git pull
cp -r backend/app/. /opt/trading-bot/app/
cp -r backend/static_frontend/. /opt/trading-bot/static_frontend/
chown -R tradingbot:tradingbot /opt/trading-bot/app /opt/trading-bot/static_frontend
systemctl restart trading-bot
sleep 2
systemctl status trading-bot --no-pager -l | head -10
echo "==> Update deployed"
