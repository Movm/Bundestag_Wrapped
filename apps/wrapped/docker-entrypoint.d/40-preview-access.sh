#!/bin/sh
# Writes the nginx map behind the 2026 preview password page (/zugang/).
# A garden fence, not a vault: the code is compared as a plain cookie value or
# as the X-Gartenzaun request header (native app); either one unlocks.
set -eu

: "${PREVIEW_ACCESS_CODE:?PREVIEW_ACCESS_CODE must be configured at runtime}"

# The password page lowercases input and keeps only [a-z0-9_-]; do the same here
# so "Aigner", "aigner" and " AIGNER " all open the gate.
code=$(printf '%s' "$PREVIEW_ACCESS_CODE" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
if [ -z "$code" ]; then
  echo "PREVIEW_ACCESS_CODE needs at least one letter, digit, _ or -" >&2
  exit 1
fi

printf 'map $cookie_gartenzaun $preview_cookie_ok {\n    default 0;\n    "%s" 1;\n}\nmap $http_x_gartenzaun $preview_header_ok {\n    default 0;\n    "%s" 1;\n}\nmap "$preview_cookie_ok$preview_header_ok" $preview_unlocked {\n    "00" 0;\n    default 1;\n}\n' "$code" "$code" > /tmp/preview-access.conf
chmod 600 /tmp/preview-access.conf
