import { remove, map, pull } from "lodash";
import f from "../Functions";
import { Action } from "appbox-formulas";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  {
    // --> Finds model from an object by ID
    // (id, requestId)
    key: "getModelFromId",
    action: async (args, models, socket, socketInfo) => {
      if (typeof args.objectId === "string") {
        const object = await models.objects.model.findOne({
          _id: args.objectId,
        });
        socket.emit(`receive-${args.requestId}`, object.objectId);
      }
    },
  },
  {
    // --> Creates listeners for object and returns data
    // (requestId, type, filter)
    key: "listenForObjects",
    action: (args, models, socket, socketInfo) => {
      // Check object type permissions
      models.models.model.findOne({ key: args.type }).then((objectType) => {
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
              let data = await models.objects.model.find({
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

            models.objects.listeners[args.requestId] = (change) => {
              returnData();
            };
            socketInfo.listeners.push(args.requestId);
            returnData();
            //console.log(`Data request: ${args.requestId}`);
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
      //console.log(`Cleaning up data request ${args.requestId}`);
      delete models.objects.listeners[args.requestId];
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
        models.models.model.find(args.filter).then((objects) => {
          socket.emit(`receive-${args.requestId}`, objects);
        });
      };

      models.models.listeners[args.requestId] = (change) => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
      //console.log(`Object type request: ${args.requestId}`);
    },
  },
  {
    // --> Cleans up listeners for object
    key: "unlistenForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      //console.log(`Cleaning up data request ${args.requestId}`);
      delete models.models.listeners[args.requestId];
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
      f.data.insertObject(models, socketInfo, args, socket);
    },
  },
  {
    // --> Update data
    // (requestId, objectId, toChange, type)
    key: "updateObject",
    action: (args, models, socket, socketInfo) => {
      f.data.updateObject(models, socketInfo, args, socket);
    },
  },
  {
    // --> Delete data
    // (requestId, objectId)
    key: "deleteObject",
    action: (args, models, socket, socketInfo) => {
      models.objects.model.findOne({ _id: args.objectId }).then((object) => {
        if (object) {
          models.models.model.findOne({ key: object.objectId }).then((type) => {
            let hasDeleteAccess = false;
            type.permissions.delete.map((permission) => {
              if (socketInfo.permissions.includes(permission)) {
                hasDeleteAccess = true;
              }
            });

            if (hasDeleteAccess) {
              if (socketInfo.username !== object.data.username) {
                models.objects.model
                  .deleteOne({ _id: args.objectId })
                  .then(() => {
                    socket.emit(`receive-${args.requestId}`, {
                      success: true,
                    });
                  });
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: false,
                  reason: "cannot-delete-self",
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
    // --> Delete data
    // (requestId, objectId)
    key: "deleteObjects",
    action: (args, models, socket, socketInfo) => {
      models.objects.model.findOne({ _id: args.objectId }).then((object) => {
        if (object) {
          models.models.model.findOne({ key: object.objectId }).then((type) => {
            let hasDeleteAccess = false;
            type.permissions.delete.map((permission) => {
              if (socketInfo.permissions.includes(permission)) {
                hasDeleteAccess = true;
              }
            });

            if (hasDeleteAccess) {
              if (socketInfo.username !== object.data.username) {
                models.objects.model
                  .deleteMany({ _id: { $in: args.objectId } })
                  .then(() => {
                    socket.emit(`receive-${args.requestId}`, {
                      success: true,
                    });
                  });
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: false,
                  reason: "cannot-delete-self",
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
        f.data.updateManyObjects(models, id, changes).then(
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
      let setting = await models.usersettings.model.findOne({
        key: args.key,
        username: socketInfo.username,
      });
      if (!setting) {
        // If it doesn't exist, create it
        setting = new models.usersettings.model();
      }
      setting.value = args.value;
      setting.username = socketInfo.username;
      setting.key = args.key;
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
      const permission = await models.apppermissions.findOne({
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
        new models.apppermissions({
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
  {
    key: "listenForAttachments",
    action: async (args, models, socket, socketInfo) => {
      const returnData = async () => {
        const response = await models.attachments.model.find({
          objectId: args.objectId,
        });
        socket.emit(`receive-${args.requestId}`, {
          success: true,
          data: response,
        });
      };
      models.attachments.listeners[args.requestId] = (change) => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
    },
  },
  {
    key: "unlistenForAttachments",
    action: async (args, models, socket, socketInfo) => {
      delete models.attachments.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    key: "performAction",
    action: async (args, models, socket, socketInfo) => {
      const vars = { ...(args.vars || {}) };
      const action = await models.objects.model.findOne({ _id: args.id });
      const varsMissing = [];
      (action?.data?.data?.triggers?.manual?.vars || []).map((v) => {
        if (!vars[v]) {
          varsMissing.push(v);
        }
      });
      if (varsMissing.length < 1) {
        await Object.keys(vars).reduce(
          // @ts-ignore
          async (prev, curr) => {
            await prev;
            const v = vars[curr];
            if (typeof v === "object") {
              vars[curr] = await models.objects.model.find({ _id: { $in: v } });
            }
            return curr;
          },
          Object.keys(vars)[0]
        );

        await new Action(action.data, models).execute(vars);
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "required-var-missing",
          vars: varsMissing,
        });
      }
    },
  },
];
