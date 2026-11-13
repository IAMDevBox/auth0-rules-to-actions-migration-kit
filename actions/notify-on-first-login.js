// Action: Login / Post Login
// Dependency "axios" is added in the Dashboard (Add a Dependency); secret WEBHOOK_URL is set on this Action.
const axios = require('axios');

exports.onExecutePostLogin = async (event, api) => {
  if (event.stats.logins_count > 1) return;

  try {
    await axios.post(
      event.secrets.WEBHOOK_URL,
      { email: event.user.email },
      { timeout: 2000 }
    );
  } catch (err) {
    // A webhook outage must not fail the login
    console.log('webhook failed', err.message);
  }
};
