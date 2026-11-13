# Auth0 Rules to Actions Migration Kit

Scripts and tested Action templates for moving Auth0 Rules and Hooks to Actions before the end-of-life dates (as listed on Auth0's [Deprecations and Migrations](https://auth0.com/docs/troubleshoot/product-lifecycle/deprecations-and-migrations) page when this was written: **Hooks April 30, 2027, Rules January 31, 2028**; both read-only since November 18, 2024. Re-check that page for your tenant).

Companion code for the guide: **[Auth0 Rules to Actions Migration: Code Mapping, Cutover Plan and the Real EOL Dates](https://www.iamdevbox.com/posts/auth0-rules-to-actions-migration-guide-read-only-deadline/)**.

## What is in here

| Path | Purpose |
|---|---|
| `scripts/inventory-rules-hooks.sh` | Lists every Rule and Hook (order, enabled, stage/trigger, size) via the Management API and flags the idioms that need manual work: Management API calls, redirects, MFA, `configuration` secrets, pinned `require('pkg@x')`, outbound HTTP |
| `scripts/lint-action-port.js` | Catches Rule syntax left behind in a ported Action: `callback(...)`, `context.*`, `configuration`, global `auth0`, `UnauthorizedError`, bare `user.*` |
| `scripts/diff-tokens.sh` | Cutover acceptance test: diff the claims of a token issued by the Rule against one issued by the Action |
| `rules/` | Two legacy Rules (roles and email verification, first-login webhook) |
| `actions/` | The ported Actions, plus a redirect (`onExecutePostLogin` / `onContinuePostLogin`) example |
| `test/actions.test.js` | Offline tests with a mocked `event`/`api` (Node 18+, no dependencies) |

## Usage

```bash
# 1. Inventory (M2M app with read:rules and read:hooks on the Management API)
export AUTH0_DOMAIN=your-tenant.us.auth0.com AUTH0_CLIENT_ID=... AUTH0_CLIENT_SECRET=...
./scripts/inventory-rules-hooks.sh > inventory.csv

# 2. Port each Rule, then lint the result
node scripts/lint-action-port.js actions/*.js

# 3. Unit-test the Action logic offline
node --test test/actions.test.js

# 4. After deploying the Action in a non-production tenant, compare tokens
./scripts/diff-tokens.sh before-rule.jwt after-action.jwt
```

Run the linter on `rules/` to see what it reports on unported code.

## Cutover order that avoids double execution

Post-Login Actions run after existing Rules, so migrate from the **end** of the Rules list backward. Deploy the Action, attach it to the Login flow and disable the replaced Rule in the same change window. Details in the [guide](https://www.iamdevbox.com/posts/auth0-rules-to-actions-migration-guide-read-only-deadline/).

## Related guides

- [Keycloak vs Auth0 vs Okta 2026](https://www.iamdevbox.com/posts/keycloak-vs-auth0-vs-okta-2026-which-iam-platform-to-choose/)
- [Auth0 vs Keycloak complete comparison](https://www.iamdevbox.com/posts/auth0-vs-keycloak-complete-comparison-guide-2025-pricing-features-performance-and-use-cases-for-choosing-the-right-iam-platform/)
- [JWT Decoder](https://www.iamdevbox.com/tools/jwt-decode/) for inspecting the tokens you diff
- [More IAM guides and tools at IAMDevBox.com](https://www.iamdevbox.com/)

## Notes

Example hostnames, namespaces and URLs use `example.com` placeholders. The Action templates were tested against a mock `event`/`api`, not a live tenant: verify in a non-production tenant before cutover.

MIT licensed.
