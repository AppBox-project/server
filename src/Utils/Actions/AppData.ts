import { remove, map } from "lodash";
import Functions from "../Functions";
import { ModelType, SocketInfoType } from "../Utils/Types";
var uniqid = require("uniqid");
import Formula from "appbox-formulas";

// Todo sanitize filter input???
// --> It may be possible to send something else than arrays which may be a way into the database

export default [
  //--> appCreatesModel()
  //{ newModel, requestId, appId }
  {
    key: "appCreatesModel",
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
      const app = await models.objects.model.findOne({
        objectId: "apps",
        "data.id": args.appId,
      });

      if (app.data.root) {
        const defaultFields = {};
        const defaultOverviewFields = [];
        const defaultLayoutFields = [];
        if (args.newModel.linked) {
          let linkName = "";
          defaultOverviewFields.push("name");
          args.newModel.linkedModels.map((link) => {
            linkName += link.slice(0, 1);
            defaultOverviewFields.push(link.value);
            defaultLayoutFields.push({
              type: "Field",
              id: uniqid(),
              field: link.value,
            });
          });
          defaultFields["name"] = {
            name: "Name",
            type: "auto_name",
            typeArgs: { prefix: linkName, mode: "increment" },
          };
          args.newModel.primary = "name";
          args.newModel.icon = "FaLink";
          args.newModel.linkedModels.map((link) => {
            defaultFields[link.value] = {
              name: link.label,
              type: "relationship",
              required: true,
              typeArgs: { relationshipTo: link.value },
            };
          });
        }
        const newModel = new models.models.model({
          ...args.newModel,
          actions: {
            create: {
              layout: "default",
              type: "create",
            },
          },
          overviews: {
            default: {
              fields: defaultOverviewFields,
              buttons: ["create"],
              actions: ["delete"],
            },
          },
          layouts: {
            default: {
              layout: [
                {
                  type: "AnimationContainer",
                  xs: 12,
                  id: "kf2r51ws",
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kf2r5375",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "kf2r56lv",
                          title: args.newModel.name,
                          withBigMargin: true,
                          key: "default",
                          items: defaultLayoutFields,
                        },
                      ],
                    },
                  ],
                },
              ],
              buttons: [],
            },
            create: {
              layout: defaultLayoutFields,
              buttons: [],
            },
          },

          fields: { ...args.newModel.fields, ...defaultFields },
          permissions: {
            read: ["known"],
            create: ["known"],
            modifyOwn: ["known"],
            write: ["known"],
            delete: ["known"],
            deleteOwn: ["known"],
            archive: ["known"],
            archiveOwn: ["known"],
          },
        });
        delete newModel["linkedModels"];

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
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
      const returnData = async () => {
        // Check app permissions
        const permissions = await models.apppermissions.model.findOne({
          appId: args.appId,
          objectId: args.modelId,
        });

        if ((permissions?.permissions || []).includes("read")) {
          // Check succesful
          // Send data
          const model = await models.models.model.findOne({
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

      models.models.listeners[args.requestId] = (change) => {
        returnData();
      };
      socketInfo.listeners.push(args.requestId);
      returnData();
    },
  },
  {
    // --> Cleans up listeners for object
    key: "appUnlistensForModel",
    action: (args, models, socket, socketInfo: SocketInfoType) => {
      delete models.models.listeners[args.requestId];
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
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
      // First map permissions for the app
      const appInfo = await models.objects.model.findOne({
        objectId: "apps",
        "data.id": args.appId,
      });
      if (appInfo.data.root) {
        const returnData = async () => {
          // --> Root mode
          // Find all objects
          const types = await models.models.model.find({ ...args.filter });
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

        models.models.listeners[args.requestId] = (change) => {
          returnData();
        };
        socketInfo.listeners.push(args.requestId);
        returnData();
        //console.log(`App object type request: ${args.requestId}`);
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
                  new Promise<void>((resolve, reject) => {
                    models.models.model
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
    action: (args, models, socket, socketInfo: SocketInfoType) => {
      delete models.models.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    // --> Creates listeners for objecttypes and returns data
    // (filter, requestId, appId)
    key: "appListensForObjects",
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
      // First map permissions for the app
      const appInfo = await models.objects.model.findOne({
        objectId: "apps",
        "data.id": args.appId,
      });
      if (appInfo?.data?.root || args.appId === "system") {
        // Root mode

        // Skip app permission check
        models.models.model.findOne({ key: args.type }).then((objectType) => {
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
                models.objects.model
                  .find({ objectId: args.type, ...args.filter })
                  .then((objects) => {
                    socket.emit(`receive-${args.requestId}`, {
                      success: true,
                      data: objects,
                    });
                  });
              };

              models.objects.listeners[args.requestId] = (change) => {
                returnData();
              };
              socketInfo.listeners.push(args.requestId);
              returnData();
              //console.log(`App data request: ${args.requestId}`);
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
                models.models.model
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
                          models.objects.model
                            .find({ objectId: args.type, ...args.filter })
                            .then((objects) => {
                              socket.emit(`receive-${args.requestId}`, {
                                success: true,
                                data: objects,
                              });
                            });
                        };

                        models.objects.listeners[args.requestId] = (change) => {
                          returnData();
                        };
                        socketInfo.listeners.push(args.requestId);
                        returnData();
                        //console.log(`App data request: ${args.requestId}`);
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
    action: (args, models, socket, socketInfo: SocketInfoType) => {
      //console.log(`Cleaning up data request ${args.requestId}`);
      delete models.objects.listeners[args.requestId];
      remove(socketInfo.listeners, (o) => {
        return o === args.requestId;
      });
    },
  },
  {
    key: "appInsertsObject",
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
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
          const model = await models.models.model.findOne({ key: args.type });

          // Add any default values to the new object's model
          //@ts-ignore
          await Object.keys(model.fields).reduce(async (prev, mKey) => {
            await prev;
            const mField = model.fields[mKey];

            if (mField.default && !args.object[mKey]) {
              let defaultValue = mField.default;
              if (mField.default.match("{{")) {
                const defaultFormula = new Formula(
                  mField.default,
                  model,
                  models,
                  name,
                  uniqid()
                );
                await defaultFormula.compile();
                const object = { __user: socketInfo.user };
                defaultValue = await defaultFormula.calculate(object, {
                  models,
                  object,
                });
              }

              console.log(defaultValue);
            }
            if (mField.type === "auto_name") {
              args.object[mKey] = `${mField.typeArgs.prefix}-`;
              if (mField.typeArgs.mode === "random") {
                args.object[mKey] += uniqid();
              } else {
                args.object[mKey] += await models.objects.model.count({
                  objectId: args.type,
                });
              }
            }
            return mKey;
          }, Object.keys(model.fields)[0]);

          // Validate the model
          Functions.data
            .validateData(model, args.object, args.type, models, false)
            .then(
              () => {
                new models.objects.model(
                  Functions.data.transformData(
                    { data: args.object, objectId: args.type },
                    model,
                    {}
                  )
                )
                  .save()
                  .then((data) => {
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
    key: "appInsertsObjects",
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
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
          const model = await models.models.model.findOne({ key: args.type });
          // Loop through all the objects
          const objectsToSave = [];
          const promises = [];
          args.objects.map((obj) =>
            promises.push(
              new Promise<void>((resolve, reject) => {
                let newObject = obj;
                // Add any default values to the new object's model
                map(model.fields, (mField, mKey) => {
                  if (mField.default && !newObject[mKey]) {
                    newObject[mKey] = mField.default;
                  }
                });

                // Validate the model
                Functions.data
                  .validateData(model, newObject, args.type, models, false)
                  .then(
                    () => {
                      objectsToSave.push(
                        Functions.data.transformData(
                          { data: newObject, objectId: args.type },
                          model,
                          {}
                        )
                      );
                      resolve();
                    },
                    (feedback) => {
                      socket.emit(`receive-${args.requestId}`, {
                        success: false,
                        feedback,
                      });
                    }
                  );
              })
            )
          );

          Promise.all(promises).then(() => {
            // Save all the validated documents
            models.objects.model.create(objectsToSave).then((data) => {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
                data,
              });
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
    key: "appDeletesObject",
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
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
          models.objects.model
            .deleteMany({ objectId: args.type, ...args.filter })
            .then(() => {
              socket.emit(`receive-${args.requestId}`, {
                success: true,
              });
            });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-delete-permission-app",
          });
        }
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-delete-permission-user",
        });
      }
    },
  },
  {
    key: "appUpdatesModel",
    action: async (args, models, socket, socketInfo) => {
      if (Functions.appdata.checkAppRoot(models, args.appId)) {
        const model = await models.models.model.findOne({
          key: args.type,
        });

        map(args.newModel, (value, key) => {
          model[key] = value;
          model.markModified(key);
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
    // This actions wrappers the appData variant of updateObject() so it can be called over the socket.
    key: "appUpdatesObject",
    action: async (args, models, socket, socketInfo) => {
      Functions.appdata.updateObject(models, socketInfo, args, socket);
    },
  },
  {
    // This actions archives an object by moving it into a seperate, less important database
    key: "appArchivesObject",
    action: async (args, models, socket, socketInfo: SocketInfoType) => {
      // Filter app permission
      const permission = await models.apppermissions.model.findOne({
        appId: args.appId,
        objectId: args.modelId,
      });

      if ((permission?.permissions || []).includes("archive")) {
        const model: ModelType = await models.models.model.findOne({
          key: args.modelId,
        });
        let hasArchivePermission = false;

        (model?.permissions?.archive || []).map(
          (permissionRequired: string) => {
            if (socketInfo.permissions.includes(permissionRequired)) {
              hasArchivePermission = true;
            }
          }
        );

        if (hasArchivePermission) {
          // Permissions are there
          const object = await models.objects.model.findOne({
            _id: args.objectId,
          });

          await models.archive.model.create({
            key: object._id,
            objectId: object.objectId,
            data: object.data,
          });

          object.delete();
          socket.emit(`receive-${args.requestId}`, {
            success: true,
          });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-archive-permission-user",
          });
        }
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-archive-permission-app",
        });
      }
    },
  },
];
