#!/bin/sh
set -eu

printf 'window.__env = {
  API_URL: "%s"
};
' "${API_URL:-http://localhost:3000/api}" > /usr/share/nginx/html/env.js
