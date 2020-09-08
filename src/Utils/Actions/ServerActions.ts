var twoFactor = require("node-2fa");

export const setUp2FA = (appName, userName) =>
  twoFactor.generateSecret({
    name: appName,
    account: userName,
  });
