import f from "../Functions";
import { systemLog } from "../Utils/Utils";
var twoFactor = require("node-2fa");

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  {
    // --> Request token
    key: "requestToken",
    action: (args, models, socket, socketInfo) => {
      models.objects.model
        .findOne({ objectId: "users", "data.username": args.user.username })
        .then((user) => {
          if (user) {
            if (f.user.compareHashes(args.user.password, user.data.password)) {
              if (user.data["mfa_enabled"]) {
                if (args.mfaToken) {
                  const mfaIsOkay = twoFactor.verifyToken(
                    user.data["mfa_secret"],
                    args.mfaToken
                  );
                  if (mfaIsOkay) {
                    if (mfaIsOkay.delta === 0) {
                      socket.emit(`receive-${args.requestId}`, {
                        success: true,
                        token: f.user.getToken(
                          args.user.username,
                          user.data.password
                        ),
                      });
                    } else if (mfaIsOkay.delta === -1) {
                      socket.emit(`receive-${args.requestId}`, {
                        success: false,
                        reason: "mfaToken-early",
                      });
                    } else {
                      socket.emit(`receive-${args.requestId}`, {
                        success: false,
                        reason: "mfaToken-late",
                      });
                    }
                  } else {
                    socket.emit(`receive-${args.requestId}`, {
                      success: false,
                      reason: "unknown-mfaToken",
                    });
                  }
                } else {
                  socket.emit(`receive-${args.requestId}`, {
                    success: false,
                    reason: "require-mfa",
                  });
                }
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: true,
                  token: f.user.getToken(
                    args.user.username,
                    user.data.password
                  ),
                });
              }
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "wrong-password",
              });
            }
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-such-user",
            });
          }
        });
    },
  },
  // --> Perform sign in based on token
  {
    key: "signIn",
    action: (args, models, socket, socketInfo) => {
      models.objects.model
        .findOne({ objectId: "users", "data.username": args.username })
        .then(async (user) => {
          if (user) {
            if (f.user.checkUserToken(user, args.token)) {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
              });

              socketInfo.username = user.data.username;
              socketInfo.user = user;
              socketInfo.identified = true;
              systemLog(`Socket identified as ${user.data.username}.`);
              const newPermissions = ["known"];

              // Find permissions
              // Todo improve
              const roles = await models.objects.model.find({
                _id: { $in: user.data.roles },
              });

              await roles.reduce(async (previousPromise, role) => {
                let newData = await previousPromise;

                const permissions = await models.objects.model.find({
                  _id: { $in: role.data.permissions },
                });
                permissions.map((permission) => {
                  newPermissions.push(permission.data.name);
                });

                return permissions;
              }, Promise.resolve([]));

              socketInfo.permissions.push(...newPermissions);
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "wrong-token",
              });
            }
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-such-user",
            });
          }
        });
    },
  },
];
