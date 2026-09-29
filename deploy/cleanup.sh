#!/bin/bash
set -uo pipefail

TAG="[cleanup $(date -u +%F_%T)]"
echo "$TAG starting weekly cleanup"

journalctl --vacuum-time=7d
apt-get clean
apt-get autoremove -y

find /tmp -mindepth 1 -mtime +7 -delete
find /opt/trading-bot -name "__pycache__" -type d -exec rm -rf {} +

echo "$TAG done"
