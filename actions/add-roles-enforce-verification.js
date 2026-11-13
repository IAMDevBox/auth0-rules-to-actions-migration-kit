// Action: Login / Post Login
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://example.com/';

  if (!event.user.email_verified) {
    return api.access.deny('Please verify your email before logging in.');
  }

  const assignedRoles = (event.authorization || {}).roles || [];
  api.idToken.setCustomClaim(namespace + 'roles', assignedRoles);
  api.accessToken.setCustomClaim(namespace + 'roles', assignedRoles);
};
