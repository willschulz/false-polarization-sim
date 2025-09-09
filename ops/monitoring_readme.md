# Monitoring for false-polarization-sim

This directory contains a lightweight monitoring setup that records resource metrics for the `false-polarization-sim` service and performs a basic HTTP healthcheck. It runs via a systemd oneshot service with a systemd timer.

## What it does
- Logs metrics (pid, RSS bytes, RSS percent of total, CPU, and FD count) to `/var/log/false-polarization-sim/metrics.log`.
- Appends monitor events to `/var/log/false-polarization-sim/monitor.log`.
- Emits a warning if an HTTP healthcheck fails (defaults to `http://127.0.0.1:8091/`).
- Includes a simple leak heuristic: if `mem_bytes` is strictly increasing across the last few samples and memory percent is high, logs an `ALERT` line.

## Files
- `ops/tools/monitor.sh`: collection script.
- `ops/systemd/false-polarization-sim-monitor.service`: oneshot service that runs the script.
- `ops/systemd/false-polarization-sim-monitor.timer`: runs the service every minute.
- `ops/logrotate/false-polarization-sim`: rotates logs daily, keeps 7 compressed archives.

## Install / Deploy
Prereqs: systemd, bash, curl.

From the project root:
```bash
./ops/install.sh
```
This will:
- Sync the app to `/opt/false-polarization-sim` (owned by `www-data`)
- Install systemd units and reload
- Create `/var/log/false-polarization-sim` and `/var/lib/false-polarization-sim` (owned by `deploy`)
- Enable and start:
  - `false-polarization-sim.service`
  - `false-polarization-sim-monitor.timer`

Verify timers:
```bash
systemctl list-timers false-polarization-sim-monitor.timer | cat
```

## Configuration
The monitor service exposes two environment variables you can override by editing `ops/systemd/false-polarization-sim-monitor.service`:
- `SERVICE_NAME` (default: `false-polarization-sim`)
- `HEALTHCHECK_URL` (default: `http://127.0.0.1:8091/`)

After making changes:
```bash
sudo cp ops/systemd/false-polarization-sim-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart false-polarization-sim-monitor.timer
```

## Manual run / debug
Run the monitor once:
```bash
bash -lc ./ops/tools/monitor.sh
```
Tail logs:
```bash
sudo tail -n 100 -F /var/log/false-polarization-sim/monitor.log /var/log/false-polarization-sim/metrics.log
```

## Interpreting logs
- `metrics.log` lines are one-per-sample in key=value pairs (easy to parse). Example:
```text
timestamp="2025-09-09T03:41:27+00:00" pid=63118 mem_bytes=19052544 mem_pct=0 cpu_pct=0.0 fd_count=5
```
- `monitor.log` includes WARN/ALERT lines for healthcheck failures and leak heuristic triggers.

## Uninstall
```bash
sudo systemctl disable --now false-polarization-sim-monitor.timer
sudo rm -f /etc/systemd/system/false-polarization-sim-monitor.{service,timer}
sudo systemctl daemon-reload
```

## Notes
- Log rotation is configured under `/etc/logrotate.d/false-polarization-sim`. Ensure logrotate is enabled on the host.
- The monitor runs at low priority (Nice=10, IOSchedulingPriority=7) to minimize interference.

