#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/deploy/projects/false-polarization-sim"
INSTALL_DIR="/opt/false-polarization-sim"

echo "Installing app to $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo rsync -a --delete "$REPO_DIR/" "$INSTALL_DIR/"
sudo chown -R www-data:www-data "$INSTALL_DIR"

echo "Installing systemd units"
sudo install -m 0644 "$REPO_DIR/ops/systemd/false-polarization-sim.service" /etc/systemd/system/false-polarization-sim.service
sudo install -m 0644 "$REPO_DIR/ops/systemd/false-polarization-sim-monitor.service" /etc/systemd/system/false-polarization-sim-monitor.service
sudo install -m 0644 "$REPO_DIR/ops/systemd/false-polarization-sim-monitor.timer" /etc/systemd/system/false-polarization-sim-monitor.timer

echo "Preparing log/state directories"
sudo mkdir -p /var/log/false-polarization-sim /var/lib/false-polarization-sim
sudo chown deploy:deploy /var/log/false-polarization-sim /var/lib/false-polarization-sim

echo "Reloading systemd and enabling services"
sudo systemctl daemon-reload
sudo systemctl enable --now false-polarization-sim.service
sudo systemctl enable --now false-polarization-sim-monitor.timer

echo "Tail status"
systemctl --no-pager status false-polarization-sim.service | sed -n '1,30p'
systemctl --no-pager list-timers false-polarization-sim-monitor.timer | sed -n '1,30p'

echo "Done."


