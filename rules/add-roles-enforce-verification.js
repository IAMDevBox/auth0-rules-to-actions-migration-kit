// Legacy Rule (read-only phase: cannot be edited in the tenant any more)
function addRolesAndEnforceVerification(user, context, callback) {
  const namespace = 'https://example.com/';

  if (!user.email_verified) {
    return callback(new UnauthorizedError('Please verify your email before logging in.'));
  }

  const assignedRoles = (context.authorization || {}).roles || [];
  context.idToken[namespace + 'roles'] = assignedRoles;
  context.accessToken[namespace + 'roles'] = assignedRoles;

  callback(null, user, context);
}
