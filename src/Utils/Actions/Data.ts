import { remove, map } from "lodash";
import f from "../Functions";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  {
    // --> Creates listeners for object and returns data
    // (requestId, type, filter)
    key: "listenForObjects",
    action: (args, models, socket, socketInfo) => {
      // Check object type permissions
      models.objects.model.findOne({ key: args.type }).then(objectType => {
        if (objectType) {
          let hasReadAccess = false;
          objectType.permissions.read.map(permission => {
            if (socketInfo.permissions.includes(permission)) {
              hasReadAccess = true;
            }
          });

          if (hasReadAccess) {
            // Find data
            const returnData = () => {
              models.entries.model
                .find({ objectId: args.type, ...args.filter })
                .then(objects => {
                  socket.emit(`receive-${args.requestId}`, {
                    success: true,
                    data: objects
                  });
                });
            };

            models.entries.listeners[args.requestId] = change => {
              returnData();
            };
            socketInfo.listeners.push(args.requestId);
            returnData();
            console.log(`Data request: ${args.requestId}`);
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-read-permissions"
            });
          }
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object",
            requestedObject: args.type
          });
        }
      });
    }
  },
  {
    // --> Cleans up listeners for object
    key: "unlistenForObjects",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up data request ${args.requestId}`);
      delete models.entries.listeners[args.requestId];
      remove(socketInfo.listeners, o => {
        return o === args.requestId;
      });
    }
  },

  {
    // --> Creates listeners for objecttypes and returns data
    // (filter, requestId)
    key: "listenForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      const returnData = () => {
        models.objects.model.find(args.filter).then(objects => {
          socket.emit(`receive-${args.requestId}`, objects);
        });
      };

      models.objects.listeners[args.requestId] = change => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
      console.log(`Object type request: ${args.requestId}`);
    }
  },
  {
    // --> Cleans up listeners for object
    key: "unlistenForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up data request ${args.requestId}`);
      delete models.objects.listeners[args.requestId];
      remove(socketInfo.listeners, o => {
        return o === args.requestId;
      });
    }
  },
  {
    // --> Insert data
    key: "insertData",
    action: (args, models, socket, socketInfo) => {
      models.objects.model.findOne({ key: args.type }).then(model => {
        if (model) {
          // Validate & save
          f.data.validateData(model, args, models, false).then(
            () => {
              new models.entries.model(
                f.data.transformData(
                  { data: args.object, objectId: args.type },
                  model
                )
              )
                .save()
                .then(data => {
                  socket.emit(`receive-${args.requestId}`, {
                    success: true
                  });
                });
            },
            feedback => {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                feedback
              });
            }
          );
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object"
          });
        }
      });
    }
  },
  {
    // --> Update data
    // (requestId, objectId, toChange)
    key: "updateObject",
    action: (args, models, socket, socketInfo) => {
      models.objects.model.findOne({ key: args.type }).then(objectType => {
        if (objectType) {
          let hasWriteAccess = false;
          objectType.permissions.write.map(permission => {
            if (socketInfo.permissions.includes(permission)) {
              hasWriteAccess = true;
            }
          });

          // Validate & save
          if (hasWriteAccess) {
            models.entries.model.findOne({ _id: args.objectId }).then(entry => {
              const object = {
                ...entry._doc
              };

              map(args.toChange, (v, k) => {
                object.data[k] = v;
              });

              f.data
                .validateData(
                  objectType,
                  { ...args, object: object.data },
                  models,
                  entry._doc
                )
                .then(
                  () => {
                    entry.data = object.data;
                    entry.markModified("data");

                    entry.save().then(() => {
                      socket.emit(`receive-${args.requestId}`, {
                        success: true
                      });
                    });
                  },
                  feedback => {
                    socket.emit(`receive-${args.requestId}`, {
                      success: false,
                      feedback
                    });
                  }
                );
            });
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-write-permission"
            });
          }
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object"
          });
        }
      });
    }
  }
];
