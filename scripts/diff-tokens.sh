#!/usr/bin/env bash
# Acceptance test for a cutover: compare the claims of two JWTs (Rule output vs Action output).
# Usage: ./diff-tokens.sh before.jwt after.jwt      (volatile claims are ignored)
set -euo pipefail
claims() {
  local p; p=$(cut -d. -f2 < "$1" | tr '_-' '/+')
  while (( ${#p} % 4 )); do p+="="; done
  printf '%s' "$p" | base64 -d 2>/dev/null | jq -S 'del(.iat,.exp,.nbf,.jti,.sid,.auth_time)'
}
diff <(claims "$1") <(claims "$2") && echo "claims identical"
