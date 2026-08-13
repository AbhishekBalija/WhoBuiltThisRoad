#!/usr/bin/env bash

set -u

project_root="$(cd "$(dirname "$0")/.." && pwd)"
backend_pid=""
frontend_pid=""

cleanup() {
  trap - EXIT INT TERM

  if [ -n "$frontend_pid" ]; then
    kill "$frontend_pid" 2>/dev/null || true
  fi

  if [ -n "$backend_pid" ]; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  [ -n "$frontend_pid" ] && wait "$frontend_pid" 2>/dev/null || true
  [ -n "$backend_pid" ] && wait "$backend_pid" 2>/dev/null || true
}

trap cleanup EXIT
trap 'exit 130' INT TERM

echo "Starting backend at http://localhost:8080"
(
  cd "$project_root/backend" || exit 1
  exec go run ./cmd/server
) &
backend_pid=$!

echo "Starting frontend at http://localhost:5173"
(
  cd "$project_root/frontend" || exit 1
  exec bun run dev
) &
frontend_pid=$!

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$backend_pid" 2>/dev/null; then
  wait "$backend_pid"
  exit $?
fi

wait "$frontend_pid"
exit $?
