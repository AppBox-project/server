import { remove, map, pull } from "lodash";
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
            const returnData = async () => {
              let data = await models.entries.model.find({
                objectId: args.type,
                ...args.filter,
              });

              // Check if local permissions are applicable
              const toSplice = [];
              data.map((dataItem, index) => {
                if (dataItem.data.permission___view) {
                  // If we have a local view field

                  if (
                    !socketInfo.permissions.includes(
                      dataItem.data.permission___view
                    )
                  ) {
                    toSplice.push(dataItem);
                  }
                }
              });
              toSplice.map((splicee) => {
                pull(data, splicee);
              });

              socket.emit(`receive-${args.requestId}`, {
                success: true,
                data,
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
              args: args,
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
                  model,
                  {}
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
      models.objects.model.findOne({ key: args.type }).then((model) => {
        if (model) {
          let hasWriteAccess = false;
          model.permissions.write.map((permission) => {
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
                    model,
                    { ...args, object: newObject },
                    models,
                    entry._doc
                  )
                  .then(
                    async () => {
                      entry.data = f.data.transformData(
                        { data: newObject, objectId: args.type },
                        model,
                        args.toChange
                      ).data;
                      entry.markModified("data");

                      // Post process
                      entry.save().then(() => {
                        f.formulas.postSave(
                          entry,
                          args.toChange,
                          model,
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
  {
    // --> Update many
    // Updates multiple entries, requires an object as such
    // { changes: {id: {fieldId: newValue} }, requestId }
    key: "updateMany",
    action: (args, models, socket, socketInfo) => {
      map(args.changes, (changes, id) => {
        f.data.updateObject(models, id, changes).then(
          (success) => {
            socket.emit(`receive-${args.requestId}`, {
              success: true,
            });
          },
          (reasons) => {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reasons,
            });
          }
        );
      });
    },
  },
  {
    // --> getUserSetting
    // Updates multiple entries, requires an object as such
    // { requestId, key }
    key: "getUserSetting",
    action: async (args, models, socket, socketInfo) => {
      // Find data
      const returnData = async () => {
        const setting = await models.usersettings.model.findOne({
          key: args.key,
          username: socketInfo.username,
        });

        if (setting) {
          socket.emit(`receive-${args.requestId}`, {
            success: true,
            data: setting,
          });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-setting",
            request: args,
          });
        }
      };

      models.usersettings.listeners[args.requestId] = (change) => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
    },
  },
  {
    // --> Cleans up listeners for object
    key: "stopGettingUserSetting",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up usersetting request ${args.requestId}`);
      delete models.usersettings.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    // --> getUserSetting
    // Updates multiple entries, requires an object as such
    // { key, value }
    key: "setUserSetting",
    action: async (args, models, socket, socketInfo) => {
      // Find data
      const setting = await models.usersettings.model.findOne({
        key: args.key,
        username: socketInfo.username,
      });
      setting.value = args.value;
      setting.markModified("value");
      setting.save();
    },
  },
  // --> allowAppAccess
  // Updates multiple entries, requires an object as such
  // { requestId, appId, objectType, permissionType }
  {
    key: "allowAppAccess",
    action: async (args, models, socket, socketInfo) => {
      // Todo: only certain people may set this property
      const permission = await models.apppermissions.model.findOne({
        appId: args.appId,
        objectId: args.objectType,
      });

      if (permission) {
        permission.permissions.push(args.permissionType);
        permission.markModified("permissions");
        permission.save().then((result) => {
          socket.emit(`receive-${args.requestId}`, { success: true });
        });
      } else {
        new models.apppermissions.model({
          appId: args.appId,
          objectId: args.objectType,
          permissions: [args.permissionType],
        })
          .save()
          .then((result) => {
            socket.emit(`receive-${args.requestId}`, { success: true });
          });
      }
    },
  },
];
