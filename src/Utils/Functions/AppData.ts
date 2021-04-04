import Functions from ".";
import { map } from "lodash";
import { AppModelType } from "appbox-types";
import { Action } from "appbox-formulas";
export default {
  checkUserObjectRights: async (
    models,
    permissions,
    object,
    permissionTypes: string[] // "read" | "create" | "modifyOwn" | "write" | "delete" | "deleteOwn"
  ) => {
    const type = await models.models.model.findOne({ key: object });

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
    const model: AppModelType = await models.apppermissions.findOne({
      appId: app,
      objectId: object,
    });

    if (model) {
      if (model.permissions.includes(permissionType)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },
  checkAppRoot: async (models, appId: string) => {
    const app = await models.objects.model.findOne({
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
        const model: AppModelType = await models.models.model.findOne({
          key: args.type,
        });
        const oldObject = await models.objects.model.findOne({
          _id: args.id,
        });

        // Create the new object
        let newObject = oldObject.data;
        map(args.newObject, (v, k) => {
          // If this is supposed to be a number, but isn't, parseInt().
          if (
            model.fields[k]?.typeArgs?.type === "number" &&
            typeof v !== "number"
          )
            v = parseInt(v);

          newObject[k] = v;
          oldObject.markModified(`data.${k}`);
        });

        // Process actions BEFORE save
        const actions = await models.objects.model.find({
          objectId: "actions",
        });
        await actions.reduce(async (prev, currAction) => {
          await prev;
          let triggerVar = undefined;
          (currAction?.data?.data?.triggers?.data || []).map((trigger) => {
            if (trigger.model === model.key) {
              map(args.toChange, (v, k) => {
                if (trigger.fields.includes(k)) triggerVar = trigger.var;
              });
            }
          });
          if (triggerVar !== undefined) {
            console.log(
              `Action ${currAction.data.name} triggered by change on ${args.objectId}.`
            );
            const action = await new Action(currAction.data, models).execute({
              [triggerVar]: newObject,
            });
            const result = action.getVar(triggerVar);
            newObject = { ...newObject, ...result.data };
          }

          return currAction;
        }, actions[0]);

        // Validate
        Functions.data
          .validateData(model, newObject, args.type, models, oldObject)
          .then(
            () => {
              oldObject.data = newObject;

              // Before saving: execute any relevant rules
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
