#!/bin/sh
set -eu

printf 'window.__env = {
  API_URL: "%s"
};
' "${API_URL:-/api}" > /usr/share/nginx/html/env.js
