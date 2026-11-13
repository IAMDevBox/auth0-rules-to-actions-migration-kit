#!/usr/bin/env bash
# Inventory every Rule and Hook in a tenant and flag the idioms that need manual work when porting.
# Needs: curl, jq. M2M app authorised for the Management API with read:rules and read:hooks.
#   AUTH0_DOMAIN=tenant.us.auth0.com AUTH0_CLIENT_ID=... AUTH0_CLIENT_SECRET=... ./inventory-rules-hooks.sh > inventory.csv
set -euo pipefail
: "${AUTH0_DOMAIN:?}" "${AUTH0_CLIENT_ID:?}" "${AUTH0_CLIENT_SECRET:?}"

TOKEN=$(curl -sf --request POST "https://${AUTH0_DOMAIN}/oauth/token" \
  --header 'content-type: application/json' \
  --data "$(jq -n --arg d "$AUTH0_DOMAIN" --arg i "$AUTH0_CLIENT_ID" --arg s "$AUTH0_CLIENT_SECRET" \
    '{grant_type:"client_credentials",client_id:$i,client_secret:$s,audience:("https://"+$d+"/api/v2/")}')" \
  | jq -r .access_token)

api() { curl -sf -H "Authorization: Bearer ${TOKEN}" "https://${AUTH0_DOMAIN}/api/v2/$1"; }

# flags: which idioms appear in the script body
FLAGS='[ (if test("auth0\\.(users|rules|clients)") then "mgmt-api" else empty end),
         (if test("context\\.redirect|redirect-callback") then "redirect" else empty end),
         (if test("context\\.multifactor") then "mfa" else empty end),
         (if test("\\bconfiguration\\b") then "secrets" else empty end),
         (if test("require\\(.[^)]*@[0-9]") then "pinned-require" else empty end),
         (if test("request|axios|fetch|http") then "outbound-http" else empty end) ] | join("+")'

echo 'kind,name,stage_or_trigger,order,enabled,lines,flags'
api 'rules?per_page=100&fields=name,order,enabled,stage,script&include_fields=true' \
  | jq -r ".[] | [\"rule\", .name, .stage, .order, .enabled, (.script|split(\"\n\")|length), (.script|${FLAGS})] | @csv"

# Hooks are the nearer deadline (April 30, 2027)
api 'hooks?per_page=100&fields=name,triggerId,enabled,script&include_fields=true' \
  | jq -r ".hooks // . | .[] | [\"hook\", .name, .triggerId, \"\", .enabled, (.script|split(\"\n\")|length), (.script|${FLAGS})] | @csv"
