import f from "../Functions";
import mongoose from "mongoose";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  {
    // --> Request token
    key: "requestToken",
    action: (args, models, socket, socketInfo) => {
      models.entries.model
        .findOne({ objectId: "user", "data.username": args.user.username })
        .then((user) => {
          if (user) {
            if (f.user.compareHashes(args.user.password, user.data.password)) {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
                token: f.user.getToken(args.user.username, user.data.password),
              });
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
      models.entries.model
        .findOne({ objectId: "user", "data.username": args.username })
        .then(async (user) => {
          if (user) {
            if (f.user.checkUserToken(user, args.token)) {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
              });

              socketInfo.username = user.data.username;
              socketInfo.identified = true;
              console.log(`Socket identified as ${user.data.username}.`);
              const newPermissions = ["known"];

              // Find permissions
              // Todo improve
              const roles = await models.entries.model.find({
                _id: { $in: user.data.roles },
              });

              await roles.reduce(async (previousPromise, role) => {
                let newData = await previousPromise;

                const permissions = await models.entries.model.find({
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
