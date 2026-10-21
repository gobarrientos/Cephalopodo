#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT=4173
if command -v node >/dev/null 2>&1; then
  (sleep 1; xdg-open "http://localhost:$PORT" >/dev/null 2>&1) &
  exec node server.mjs
elif command -v python3 >/dev/null 2>&1; then
  echo "Node.js no encontrado; usando Python 3 (http://localhost:$PORT)"
  (sleep 1; xdg-open "http://localhost:$PORT" >/dev/null 2>&1) &
  exec python3 -m http.server $PORT --bind 127.0.0.1 --directory src
else
  echo "Instala Node.js 18+ (https://nodejs.org) o Python 3." >&2
  exit 1
fi
