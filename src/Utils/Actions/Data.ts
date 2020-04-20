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
      models.objects.model.findOne({ key: args.type }).then((objectType) => {
        if (objectType) {
          let hasReadAccess = false;
          objectType.permissions.read.map((permission) => {
            if (socketInfo.permissions.includes(permission)) {
              hasReadAccess = true;
            }
          });

          if (hasReadAccess) {
            // Find data
            const returnData = () => {
              models.entries.model
                .find({ objectId: args.type, ...args.filter })
                .then((objects) => {
                  socket.emit(`receive-${args.requestId}`, {
                    success: true,
                    data: objects,
                  });
                });
            };

            models.entries.listeners[args.requestId] = (change) => {
              returnData();
            };
            socketInfo.listeners.push(args.requestId);
            returnData();
            console.log(`Data request: ${args.requestId}`);
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-read-permissions",
            });
          }
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object",
            requestedObject: args.type,
          });
        }
      });
    },
  },
  {
    // --> Cleans up listeners for object
    key: "unlistenForObjects",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up data request ${args.requestId}`);
      delete models.entries.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },

  {
    // --> Creates listeners for objecttypes and returns data
    // (filter, requestId)
    key: "listenForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      const returnData = () => {
        models.objects.model.find(args.filter).then((objects) => {
          socket.emit(`receive-${args.requestId}`, objects);
        });
      };

      models.objects.listeners[args.requestId] = (change) => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
      console.log(`Object type request: ${args.requestId}`);
    },
  },
  {
    // --> Cleans up listeners for object
    key: "unlistenForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up data request ${args.requestId}`);
      delete models.objects.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    // --> Insert data
    key: "insertObject",
    // (requestId, type, data)
    action: (args, models, socket, socketInfo) => {
      models.objects.model.findOne({ key: args.type }).then((model) => {
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
                .then((data) => {
                  // Todo: postprocess (formulas)
                  socket.emit(`receive-${args.requestId}`, {
                    success: true,
                  });
                });
            },
            (feedback) => {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                feedback,
              });
            }
          );
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object",
          });
        }
      });
    },
  },
  {
    // --> Update data
    // (requestId, objectId, toChange, type)
    key: "updateObject",
    action: (args, models, socket, socketInfo) => {
      models.objects.model.findOne({ key: args.type }).then((objectType) => {
        if (objectType) {
          let hasWriteAccess = false;
          objectType.permissions.write.map((permission) => {
            if (socketInfo.permissions.includes(permission)) {
              hasWriteAccess = true;
            }
          });

          // Validate & save
          if (hasWriteAccess) {
            models.entries.model
              .findOne({ _id: args.objectId })
              .then((entry) => {
                // Create the new object
                const newObject = entry._doc.data;
                map(args.toChange, (v, k) => {
                  newObject[k] = args.toChange[k];
                });

                f.data
                  .validateData(
                    objectType,
                    { ...args, object: newObject },
                    models,
                    entry._doc
                  )
                  .then(
                    async () => {
                      entry.data = newObject;
                      entry.markModified("data");

                      // Post process

                      entry.save().then(() => {
                        f.formulas.postSave(
                          entry,
                          args.toChange,
                          objectType,
                          models
                        );

                        socket.emit(`receive-${args.requestId}`, {
                          success: true,
                        });
                      });
                    },
                    (feedback) => {
                      socket.emit(`receive-${args.requestId}`, {
                        success: false,
                        feedback,
                      });
                    }
                  );
              });
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-write-permission",
            });
          }
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object",
          });
        }
      });
    },
  },
  {
    // --> Delete data
    // (requestId, objectId)
    key: "deleteObject",
    action: (args, models, socket, socketInfo) => {
      models.entries.model.findOne({ _id: args.objectId }).then((object) => {
        if (object) {
          models.objects.model
            .findOne({ key: object.objectId })
            .then((type) => {
              let hasDeleteAccess = false;
              type.permissions.delete.map((permission) => {
                if (socketInfo.permissions.includes(permission)) {
                  hasDeleteAccess = true;
                }
              });

              if (hasDeleteAccess) {
                if (socketInfo.username !== object.data.username) {
                  models.entries.model
                    .deleteOne({ _id: args.objectId })
                    .then(() => {
                      socket.emit(`receive-${args.requestId}`, {
                        success: true,
                      });
                    });
                } else {
                  socket.emit(`receive-${args.requestId}`, {
                    success: false,
                    reason: "delete-own-username",
                  });
                }
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: false,
                  reason: "no-delete-permission",
                });
              }
            });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object",
          });
        }
      });
    },
  },
];
