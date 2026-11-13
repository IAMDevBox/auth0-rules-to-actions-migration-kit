// Offline tests with a mock `api`/`event`. Run: node --test test/
const test = require('node:test');
const assert = require('node:assert');
const NS = 'https://example.com/';

function mockApi() {
  const calls = { id: {}, access: {}, denied: null, meta: {}, redirect: null };
  return {
    calls,
    access: { deny: (m) => { calls.denied = m; } },
    idToken: { setCustomClaim: (k, v) => { calls.id[k] = v; } },
    accessToken: { setCustomClaim: (k, v) => { calls.access[k] = v; } },
    user: { setAppMetadata: (k, v) => { calls.meta[k] = v; } },
    redirect: { sendUserTo: (url, o) => { calls.redirect = { url, o }; } },
  };
}

test('unverified email is denied, no claims set', async () => {
  const a = require('../actions/add-roles-enforce-verification.js');
  const api = mockApi();
  await a.onExecutePostLogin({ user: { email_verified: false } }, api);
  assert.match(api.calls.denied, /verify your email/);
  assert.deepStrictEqual(api.calls.id, {});
});

test('roles go on both tokens; missing authorization is safe', async () => {
  const a = require('../actions/add-roles-enforce-verification.js');
  let api = mockApi();
  await a.onExecutePostLogin({ user: { email_verified: true }, authorization: { roles: ['admin'] } }, api);
  assert.deepStrictEqual(api.calls.id[NS + 'roles'], ['admin']);
  assert.deepStrictEqual(api.calls.access[NS + 'roles'], ['admin']);
  api = mockApi();
  await a.onExecutePostLogin({ user: { email_verified: true } }, api);
  assert.deepStrictEqual(api.calls.id[NS + 'roles'], []);
});

test('webhook action skips repeat logins and never throws on outage', async () => {
  const Module = require('module');
  let posts = 0, fail = false;
  const orig = Module._load;
  Module._load = function (req, ...r) {
    return req === 'axios' ? { post: async () => { posts++; if (fail) throw new Error('down'); } } : orig.call(this, req, ...r);
  };
  const a = require('../actions/notify-on-first-login.js');
  const ev = (n) => ({ stats: { logins_count: n }, secrets: { WEBHOOK_URL: 'https://hooks.example.com/x' }, user: { email: 'u@example.com' } });
  await a.onExecutePostLogin(ev(2), mockApi());
  assert.strictEqual(posts, 0);
  fail = true;
  await a.onExecutePostLogin(ev(1), mockApi()); // must not throw
  assert.strictEqual(posts, 1);
  Module._load = orig;
});

test('redirect pauses, continue sets metadata', async () => {
  const a = require('../actions/terms-redirect.js');
  let api = mockApi();
  await a.onExecutePostLogin({ user: { app_metadata: {}, email: 'u@example.com' } }, api);
  assert.strictEqual(api.calls.redirect.url, 'https://app.example.com/terms');
  api = mockApi();
  await a.onExecutePostLogin({ user: { app_metadata: { terms_accepted: true } } }, api);
  assert.strictEqual(api.calls.redirect, null);
  await a.onContinuePostLogin({}, api);
  assert.strictEqual(api.calls.meta.terms_accepted, true);
});
