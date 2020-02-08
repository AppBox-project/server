import f from "../Functions";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  {
    // --> Request token
    key: "requestToken",
    action: (args, models, socket, socketInfo) => {
      models.entries.model
        .findOne({ objectId: "user", "data.username": args.user.username })
        .then(user => {
          if (user) {
            if (f.user.compareHashes(args.user.password, user.data.password)) {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
                token: f.user.getToken(args.user.username, user.data.password)
              });
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "wrong-password"
              });
            }
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-such-user"
            });
          }
        });
    }
  },
  // --> Perform sign in based on token
  {
    key: "signIn",
    action: (args, models, socket, socketInfo) => {
      models.entries.model
        .findOne({ objectId: "user", "data.username": args.username })
        .then(user => {
          if (user) {
            if (f.user.checkUserToken(user, args.token)) {
              socket.emit(`receive-${args.requestId}`, {
                success: true
              });
              socketInfo.permissions.push("known");
              socketInfo.username = user.data.username;
              console.log(`Socket identified as ${user.data.username}`);
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "wrong-token"
              });
            }
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-such-user"
            });
          }
        });
    }
  }
];
