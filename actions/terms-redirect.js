// Action: Login / Post Login (redirect = pause and resume)
exports.onExecutePostLogin = async (event, api) => {
  if (event.user.app_metadata.terms_accepted) return;

  api.redirect.sendUserTo('https://app.example.com/terms', {
    query: { email: event.user.email }
  });
};

exports.onContinuePostLogin = async (event, api) => {
  // Runs after the user returns to https://{domain}/continue?state=...
  api.user.setAppMetadata('terms_accepted', true);
};
