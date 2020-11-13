import { SocketInfoType } from "../../Utils/Utils/Types";
var twoFactor = require("node-2fa");
const fs = require("fs");

export const setUp2FA = (context: {
  args: { [key: string]: any };
  models;
  socket;
  socketInfo: SocketInfoType;
}) => {
  if (context.socketInfo.user._id.toString() === context.args.id.toString()) {
    return {
      ...twoFactor.generateSecret({
        name: context.args.appName,
        account: context.args.userName,
      }),
      success: true,
    };
  } else {
    return { success: false, reason: "this-isnt-you" };
  }
};

export const compareSecretAndToken = (
  secret,
  token,
  objectId,
  models,
  enabled_field,
  secret_field,
  qr_field,
  qr
) =>
  new Promise(async (resolve, reject) => {
    const result = twoFactor.verifyToken(secret, token);
    if (!result) {
      resolve("token-wrong");
    } else if (result.delta === -1) {
      resolve("too-late");
    } else if (result.delta === 1) {
      resolve("too-early");
    } else {
      // TODO: needs to be heavily authorized. Otherwise you can just modify other peoples secrets.
      const object = await models.objects.model.findOne({ _id: objectId });
      object.data[enabled_field] = true;
      object.markModified(`data.${enabled_field}`);
      object.data[secret_field] = secret;
      object.markModified(`data.${secret_field}`);
      object.data[qr_field] = qr;
      object.markModified(`data.${qr_field}`);

      object.save().then(() => resolve("good"));
    }
  });

export const generateDocument = async (context) => {
  const template = await context.models.objects.model.findOne({
    _id: context.args.template,
  });
  const object = await context.models.objects.model.findOne({
    _id: context.args.objectId,
  });
  await new context.models.objects.model({
    objectId: "system-task",
    data: {
      name: `Generate '${template.data.name}' for ${template.data.model}`,
      type: "generate-document",
      action: "generate-document",
      done: false,
      progress: 0,
      state: "Waiting...",
      target: "Engine",
      arguments: { template, object },
    },
  }).save();
};
