#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=/var/log/false-polarization-sim
STATE_DIR=/var/lib/false-polarization-sim
SERVICE_NAME=${SERVICE_NAME:-false-polarization-sim}
HEALTHCHECK_URL=${HEALTHCHECK_URL:-http://127.0.0.1:8091/}

mkdir -p "$LOG_DIR" "$STATE_DIR"

log() {
  local ts
  ts=$(date -Is)
  echo "$ts $*" | tee -a "$LOG_DIR/monitor.log"
}

# Find the main service's PID
PID=$(systemctl show -p MainPID --value "$SERVICE_NAME" || true)
if [[ -z "$PID" || "$PID" == "0" ]]; then
  log "WARN service $SERVICE_NAME not running"
  exit 0
fi

# Collect basic metrics
MEM_KB=$(awk '/^VmRSS:/ {print $2}' /proc/$PID/status 2>/dev/null || true)
MEM_BYTES=$(( ${MEM_KB:-0} * 1024 ))
CPU_RAW=$(ps -p "$PID" -o %cpu= 2>/dev/null || true)
CPU_STAT=${CPU_RAW//[[:space:]]/}
if [[ -d "/proc/$PID/fd" ]]; then
  FD_COUNT=$( (ls -1 "/proc/$PID/fd" 2>/dev/null | wc -l | tr -d ' ') || echo 0 )
else
  FD_COUNT=0
fi

TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2*1024}')
MEM_PCT=0
if [[ ${TOTAL_MEM:-0} -gt 0 && ${MEM_BYTES:-0} -gt 0 ]]; then
  MEM_PCT=$(( MEM_BYTES * 100 / TOTAL_MEM ))
fi

# Append metrics in a key=value format on one line
printf 'timestamp="%s" pid=%s mem_bytes=%s mem_pct=%s cpu_pct=%s fd_count=%s\n' \
  "$(date -Is)" "$PID" "${MEM_BYTES:-0}" "${MEM_PCT:-0}" "${CPU_STAT:-0}" "${FD_COUNT:-0}" >> "$LOG_DIR/metrics.log"

# Leak heuristic: strictly increasing mem_bytes over last N samples and over threshold
N=5
mapfile -t lines < <(tail -n "$N" "$LOG_DIR/metrics.log" 2>/dev/null || true)
if (( ${#lines[@]} >= 3 )); then
  inc=true
  prev=-1
  for line in "${lines[@]}"; do
    # extract mem_bytes value explicitly
    mb=$(printf '%s\n' "$line" | sed -n 's/.*mem_bytes=\([0-9][0-9]*\).*/\1/p')
    if [[ -z "$mb" ]]; then inc=false; break; fi
    if (( prev >= 0 )) && (( mb <= prev )); then inc=false; break; fi
    prev=$mb
  done
  if $inc && (( MEM_PCT > 30 )); then
    log "ALERT possible leak: mem_pct=$MEM_PCT pid=$PID"
  fi
fi

# Healthcheck HTTP endpoint via localhost if served
if command -v curl >/dev/null 2>&1; then
  curl -fsS "$HEALTHCHECK_URL" >/dev/null || log "WARN http check failed: $HEALTHCHECK_URL"
fi

exit 0


