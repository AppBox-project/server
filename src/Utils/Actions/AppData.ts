import { remove, map } from "lodash";
import Functions from "../Functions";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  //--> appCreatesModel()
  //{ newModel, requestId, appId }
  {
    key: "appCreatesModel",
    action: async (args, models, socket, socketInfo) => {
      const app = await models.entries.model.findOne({
        objectId: "app",
        "data.id": args.appId,
      });

      if (app.data.root) {
        const newModel = new models.objects.model({
          ...args.newModel,
          permissions: {
            read: ["known"],
            create: ["known"],
            modifyOwn: ["known"],
            write: ["known"],
            delete: ["known"],
            deleteOwn: ["known"],
          },
        });
        newModel.save().then(() => {
          socket.emit(`receive-${args.requestId}`, { success: true });
        });
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-root-app",
          request: { ...args, action: "appCreatesModel" },
        });
      }
    },
  },
  {
    key: "appListensForModel",
    action: async (args, models, socket, socketInfo) => {
      const returnData = async () => {
        // Check app permissions
        const permissions = await models.apppermissions.model.findOne({
          appId: args.appId,
          objectId: args.modelId,
        });

        if (permissions.permissions.includes("read")) {
          // Check succesful
          // Send data
          const model = await models.objects.model.findOne({
            key: args.modelId,
          });
          socket.emit(`receive-${args.requestId}`, {
            success: true,
            data: model,
          });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-read-permission-app",
          });
        }
      };

      models.objects.listeners[args.requestId] = (change) => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
    },
  },
  {
    // --> Cleans up listeners for object
    key: "appUnlistensForModel",
    action: (args, models, socket, socketInfo) => {
      delete models.objects.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    // Todo: legacy function; remove
    // --> Creates listeners for objecttypes and returns data
    // (filter, requestId, appId)
    key: "appListensForObjectTypes",
    action: async (args, models, socket, socketInfo) => {
      // First map permissions for the app
      const appInfo = await models.entries.model.findOne({
        objectId: "app",
        "data.id": args.appId,
      });
      if (appInfo.data.root) {
        const returnData = async () => {
          // --> Root mode
          // Find all objects
          const types = await models.objects.model.find({ ...args.filter });
          const response = [];

          // Do check user permissions though
          types.map((objectType) => {
            let userPermission = false;
            objectType.permissions.read.map((p) => {
              if (socketInfo.permissions.includes(p)) {
                userPermission = true;
              }
            });
            if (userPermission) {
              response.push(objectType);
            }
          });
          if (response.length > 0) {
            socket.emit(`receive-${args.requestId}`, {
              success: true,
              data: response,
            });
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-results",
              request: args,
            });
          }
        };

        models.objects.listeners[args.requestId] = (change) => {
          returnData();
        };
        socketInfo.listeners.push(args.requestId);
        returnData();
        console.log(`App object type request: ${args.requestId}`);
      } else {
        // Regular mode
        models.apppermissions.model
          .find({ appId: args.appId, ...args.filter })
          .then((appPermissions) => {
            const promises = [];
            const response = [];
            map(appPermissions, (appPermission) => {
              // Then map permissions for the user
              if (appPermission.permissions.includes("read")) {
                promises.push(
                  new Promise((resolve, reject) => {
                    models.objects.model
                      .findOne({ appId: args.appId, ...args.filter })
                      .then((type) => {
                        type.permissions.read.map((permission) => {
                          if (socketInfo.permissions.includes(permission)) {
                            // We have read access
                            response.push(type);
                          }
                        });
                        resolve();
                      });
                  })
                );
              }
            });

            if (promises.length > 0) {
              Promise.all(promises).then(() => {
                socket.emit(`receive-${args.requestId}`, {
                  success: true,
                  data: response,
                });
              });
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "no-results",
                request: { ...args, action: "appListensForObjectTypes" },
              });
            }
          });
      }
    },
  },
  {
    // --> Cleans up listeners for object
    key: "appUnlistensForObjectTypes",
    action: (args, models, socket, socketInfo) => {
      delete models.objects.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    // --> Creates listeners for objecttypes and returns data
    // (filter, requestId, appId)
    key: "appListensForObjects",
    action: async (args, models, socket, socketInfo) => {
      // First map permissions for the app
      const appInfo = await models.entries.model.findOne({
        objectId: "app",
        "data.id": args.appId,
      });
      if (appInfo.data.root) {
        // Root mode

        // Skip app permission check
        models.objects.model.findOne({ key: args.type }).then((objectType) => {
          if (objectType) {
            let userPermission = false;
            objectType.permissions.read.map((p) => {
              if (socketInfo.permissions.includes(p)) {
                userPermission = true;
              }
            });
            if (userPermission) {
              // App & user permissions -> Find the actual data
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
              console.log(`App data request: ${args.requestId}`);
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "no-permission-user",
              });
            }
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-such-type",
              request: { ...args, action: "appListensForObjects" },
            });
          }
        });
      } else {
        // Non-root mode
        // First check read permission
        models.apppermissions.model
          .findOne({ appId: args.appId, objectId: args.type })
          .then((permission) => {
            if (permission) {
              if (permission.permissions.includes("read")) {
                // App permissions are there
                // Check user permissions
                models.objects.model
                  .findOne({ key: args.type })
                  .then((objectType) => {
                    if (objectType) {
                      let userPermission = false;
                      objectType.permissions.read.map((p) => {
                        if (socketInfo.permissions.includes(p)) {
                          userPermission = true;
                        }
                      });
                      if (userPermission) {
                        // App & user permissions -> Find the actual data
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
                        console.log(`App data request: ${args.requestId}`);
                      } else {
                        socket.emit(`receive-${args.requestId}`, {
                          success: false,
                          reason: "no-permission-user",
                        });
                      }
                    } else {
                      socket.emit(`receive-${args.requestId}`, {
                        success: false,
                        reason: "no-such-type",
                        request: { ...args, action: "appListensForObjects" },
                      });
                    }
                  });
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: false,
                  reason: "no-permission-app",
                });
              }
            } else {
              socket.emit(`receive-${args.requestId}`, {
                success: false,
                reason: "no-permission-app",
              });
            }
          });
      }
    },
  },
  {
    // --> Cleans up listeners for object
    key: "appUnlistensForObjects",
    action: (args, models, socket, socketInfo) => {
      console.log(`Cleaning up data request ${args.requestId}`);
      delete models.entries.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    key: "appInsertsObject",
    action: async (args, models, socket, socketInfo) => {
      if (
        await Functions.appdata.checkUserObjectRights(
          models,
          socketInfo.permissions,
          args.type,
          ["create"]
        )
      ) {
        if (
          await Functions.appdata.checkAppObjectRights(
            models,
            args.appId,
            args.type,
            "create"
          )
        ) {
          // We have permission. Create object
          const model = await models.objects.model.findOne({ key: args.type });

          // Add any default values to the new object's model
          map(model.fields, (mField, mKey) => {
            if (mField.default) {
              args.object[mKey] = mField.default;
            }
          });

          // Validate the model
          Functions.data.validateData(model, args, models, false).then(
            () => {
              new models.entries.model(
                Functions.data.transformData(
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
                    data,
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
            reason: "no-create-permission-app",
          });
        }
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-create-permission-user",
        });
      }
    },
  },
  {
    key: "appDeletesObject",
    action: async (args, models, socket, socketInfo) => {
      if (
        await Functions.appdata.checkUserObjectRights(
          models,
          socketInfo.permissions,
          args.type,
          ["delete", "deleteOwn"]
        )
      ) {
        if (
          await Functions.appdata.checkAppObjectRights(
            models,
            args.appId,
            args.type,
            "delete"
          )
        ) {
          // Todo: sanatize input
          models.entries.model
            .deleteMany({ objectId: args.type, ...args.filter })
            .then(() => {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
              });
            });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-create-permission-app",
          });
        }
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-create-permission-user",
        });
      }
    },
  },
  {
    key: "appUpdatesModel",
    action: async (args, models, socket, socketInfo) => {
      if (Functions.appdata.checkAppRoot(models, args.appId)) {
        const model = await models.objects.model.findOne({
          key: args.type,
          _id: args.id,
        });

        map(args.newModel, (value, key) => {
          model[key] = value;
        });

        model.save().then((model) => {
          socket.emit(`receive-${args.requestId}`, {
            success: true,
            model,
          });
        });
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "app-not-root",
        });
      }
    },
  },
  {
    key: "appUpdatesObject",
    action: async (args, models, socket, socketInfo) => {
      if (
        await Functions.appdata.checkUserObjectRights(
          models,
          socketInfo.permissions,
          args.type,
          ["write", "modifyOwn"]
        )
      ) {
        if (
          await Functions.appdata.checkAppObjectRights(
            models,
            args.appId,
            args.type,
            "create"
          )
        ) {
          // We have permission. Create object
          const model = await models.objects.model.findOne({ key: args.type });
          const oldObject = await models.entries.model.findOne({
            _id: args.id,
          });

          // Create the new object
          const newObject = oldObject.data;
          map(args.newObject, (v, k) => {
            newObject[k] = v;
          });

          Functions.data
            .validateData(
              model,
              { ...args, object: newObject },
              models,
              oldObject
            )
            .then(
              () => {
                oldObject.data = newObject;
                oldObject.markModified("data");

                oldObject.save().then(() => {
                  // Todo: postprocess (formulas)
                  socket.emit(`receive-${args.requestId}`, {
                    success: true,
                    object: oldObject,
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
            reason: "no-create-permission-app",
          });
        }
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-create-permission-user",
        });
      }
    },
  },
];
