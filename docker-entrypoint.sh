#!/bin/sh
set -eu

if [ -n "${ADMIN_DASHBOARD_KEY:-}" ]; then
  digest=$(printf '%s' "$ADMIN_DASHBOARD_KEY" | sha256sum | cut -d ' ' -f 1)
  until redis-cli -h redis -a "${REDIS_PASSWORD:?REDIS_PASSWORD is required}" ping >/dev/null 2>&1; do
    sleep 1
  done
  redis-cli -h redis -a "${REDIS_PASSWORD:?REDIS_PASSWORD is required}" set exam-gcp:admin-key "$digest" >/dev/null
fi

if [ -f /app/questions.json ]; then
  until redis-cli -h redis -a "${REDIS_PASSWORD:?REDIS_PASSWORD is required}" ping >/dev/null 2>&1; do
    sleep 1
  done
  redis-cli -h redis -a "${REDIS_PASSWORD:?REDIS_PASSWORD is required}" -x set "${QUESTION_BANK_KEY:-exam-gcp:question-bank:v1}" < /app/questions.json >/dev/null
fi

exec "$@"
