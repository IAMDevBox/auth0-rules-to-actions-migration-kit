#!/usr/bin/env node
// Flags Rule-era idioms that break (or silently misbehave) inside an Action.
// Usage: node scripts/lint-action-port.js actions/*.js   (exit 1 if anything is found)
const fs = require('fs');

const CHECKS = [
  [/\bcallback\s*\(/, 'callback(...) does not exist in Actions: return, or return api.access.deny(msg)'],
  [/function\s*\(\s*user\s*,\s*context\s*,\s*callback/, 'Rule signature: use exports.onExecutePostLogin = async (event, api) => {}'],
  [/(^|[^.\w])context\.(idToken|accessToken)\s*[\[.]/, 'context.idToken/accessToken: use api.idToken/api.accessToken.setCustomClaim()'],
  [/(^|[^.\w])context\.(clientID|connectionID|protocol|tenant|stats|sso|redirect|multifactor)\b/, 'context.* is gone: read event.client / event.connection / event.transaction / event.stats / event.session'],
  [/(^|[^.\w])configuration\b/, 'configuration (Rule secrets bag): use event.secrets.KEY (secrets are per Action)'],
  [/(^|[^.\w])auth0\.(users|rules|clients)/, 'global auth0 object is not provided: use api.user.set*() or an M2M app via secrets'],
  [/\bUnauthorizedError\b/, 'UnauthorizedError is Rules-only: use api.access.deny(reason)'],
  [/require\(\s*['"][^'"]+@\d[^'"]*['"]\s*\)/, "pinned require('pkg@1.2.3'): add the dependency in the Dashboard and require('pkg')"],
  [/(^|[^.\w])user\.(email|user_id|app_metadata|user_metadata|email_verified)\b/, 'bare user.*: read event.user.*'],
];

let problems = 0;
for (const file of process.argv.slice(2)) {
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return; // ignore comment lines
    for (const [re, msg] of CHECKS) {
      if (re.test(line)) {
        problems++;
        console.log(`${file}:${i + 1}: ${msg}\n    ${line.trim()}`);
      }
    }
  });
}
console.log(problems ? `\n${problems} problem(s) found` : 'clean');
process.exit(problems ? 1 : 0);
