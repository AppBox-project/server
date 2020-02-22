export default {
  checkUserObjectRights: async (
    models,
    permissions,
    object,
    permissionType: "create" | "write" | "read" | "delete"
  ) => {
    const type = await models.objects.model.findOne({ key: object });

    let hasPermission = false;
    type.permissions[permissionType].map(permission => {
      if (permissions.includes(permission)) {
        hasPermission = true;
      }
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
  }
};
