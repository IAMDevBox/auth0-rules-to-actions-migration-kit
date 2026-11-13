// Legacy Rule: webhook on first login
function notifyOnFirstLogin(user, context, callback) {
  const request = require('request@2.88.2');
  const { WEBHOOK_URL } = configuration;

  if (context.stats.loginsCount > 1) {
    return callback(null, user, context);
  }

  request.post({ url: WEBHOOK_URL, json: { email: user.email } }, (err) => {
    if (err) console.log('webhook failed', err);
    callback(null, user, context);
  });
}
