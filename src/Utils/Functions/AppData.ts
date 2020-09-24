import Functions from ".";
import { map } from "lodash";

export default {
  checkUserObjectRights: async (
    models,
    permissions,
    object,
    permissionTypes: string[] // "read" | "create" | "modifyOwn" | "write" | "delete" | "deleteOwn"
  ) => {
    const type = await models.objects.model.findOne({ key: object });

    let hasPermission = false;
    permissionTypes.map((permissionType) => {
      type.permissions[permissionType].map((permission) => {
        if (permissions.includes(permission)) {
          hasPermission = true;
        }
      });
    });

    return hasPermission;
  },
  checkAppObjectRights: async (
    models,
    app: string,
    object: string,
    permissionType: "create" | "write" | "read" | "delete" | "update"
  ) => {
    const type = await models.apppermissions.model.findOne({
      appId: app,
      objectId: object,
    });

    if (type) {
      if (type.permissions.includes(permissionType)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },
  checkAppRoot: async (models, appId: string) => {
    const app = await models.entries.model.findOne({
      objectId: "apps",
      "data.id": appId,
    });
    return app.root;
  },

  // ----------> updateObject
  // This command updates an object and performs all required checks
  // - models: mongoose object
  // - socketInfo: information about executing socket
  // - args: arguments as supplied by the call
  // --- type: model type to be updated
  // --- appId: app that is calling this request
  // --- id: object id
  // --- newObject: data the object needs to turn into
  // --- requestId: ID as supplied by the request
  // - socket: the calling socket
  updateObject: async (models, socketInfo, args, socket) => {
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
          "update"
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
          oldObject.markModified(`data.${k}`);
        });

        Functions.data
          .validateData(model, newObject, args.type, models, oldObject)
          .then(
            () => {
              oldObject.data = newObject;

              oldObject.save().then(() => {
                // We're done. The object was saved.
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
          reason: "no-update-permission-app",
        });
      }
    } else {
      socket.emit(`receive-${args.requestId}`, {
        success: false,
        reason: "no-update-permission-user",
      });
    }
  },
};
