import { remove, map } from "lodash";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  {
    // --> Creates listeners for objecttypes and returns data
    // (filter, requestId, appId)
    key: "appListensForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      // First map permissions for the app
      models.apppermissions.model
        .find({ appId: args.appId, ...args.filter })
        .then(appPermissions => {
          const promises = [];
          const response = [];
          map(appPermissions, appPermission => {
            // Then map permissions for the user
            if (appPermission.permissions.includes("read")) {
              promises.push(
                new Promise((resolve, reject) => {
                  models.objects.model
                    .findOne({ key: appPermission.objectId })
                    .then(type => {
                      type.permissions.read.map(permission => {
                        if (socketInfo.permissions.includes(permission)) {
                          // We have read access
                          response.push(type);
                        }
                      });
                      resolve();
                    });
                })
              );

              if (promises.length > 0) {
                Promise.all(promises).then(() => {
                  socket.emit(`receive-${args.requestId}`, {
                    success: true,
                    data: response
                  });
                });
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: false,
                  reason: "no-results"
                });
              }
            }
          });
        });
    }
  },
  {
    // --> Cleans up listeners for object
    key: "appUnlistensForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up data request ${args.requestId}`);
      delete models.objects.listeners[args.requestId];
      remove(socketInfo.listeners, o => {
        return o === args.requestId;
      });
    }
  }
];
