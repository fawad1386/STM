#!/usr/bin/env bash
# Stop local Node dev servers that block Docker ports (5000, 5173).
# Does not touch Docker-owned processes.

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || return 0
  for pid in $pids; do
    local comm
    comm=$(ps -p "$pid" -o comm= 2>/dev/null || true)
    if [[ "$comm" == *node* ]] || [[ "$comm" == *vite* ]]; then
      echo "Freeing port $port (PID $pid, $comm)"
      kill "$pid" 2>/dev/null || true
    fi
  done
}

free_port 5000
free_port 5173
sleep 1

if lsof -ti:5000 >/dev/null 2>&1; then
  echo ""
  echo "WARNING: Port 5000 still in use."
  echo "On macOS, System Settings → General → AirDrop & Handoff →"
  echo "turn OFF 'AirPlay Receiver' (it uses port 5000), then retry."
  echo ""
  lsof -i :5000 -P -n 2>/dev/null || true
  exit 1
fi

echo "Ports ready for Docker demo."
