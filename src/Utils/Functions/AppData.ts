export default {
  checkUserObjectRights: async (
    models,
    permissions,
    object,
    permissionTypes: string[] // "read" | "create" | "modifyOwn" | "write" | "delete" | "deleteOwn"
  ) => {
    const type = await models.objects.model.findOne({ key: object });

    let hasPermission = false;
    permissionTypes.map(permissionType => {
      type.permissions[permissionType].map(permission => {
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
    permissionType: "create" | "write" | "read" | "delete"
  ) => {
    const type = await models.apppermissions.model.findOne({
      appId: app,
      objectId: object
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
      objectId: "app",
      "data.id": appId
    });
    return app.root;
  }
};
