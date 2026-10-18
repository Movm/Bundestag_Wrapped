#!/bin/sh
set -eu

: "${PREVIEW_ACCESS_CODE:?PREVIEW_ACCESS_CODE must be configured at runtime}"

preview_access_user="${PREVIEW_ACCESS_USER:-preview}"
htpasswd -Bbc /tmp/preview.htpasswd "$preview_access_user" "$PREVIEW_ACCESS_CODE" >/dev/null
chmod 600 /tmp/preview.htpasswd
