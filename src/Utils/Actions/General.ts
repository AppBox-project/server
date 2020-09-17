import f from "../Functions";
import { getIndex } from "../Utils/Index";
import { systemLog } from "../Utils/Utils";
import { setUp2FA, compareSecretAndToken } from "./ServerActions";
const fuzzysort = require("fuzzysort");

export default [
  {
    key: "updateBox",
    action: async (args, models, socket, socketInfo) => {
      // Todo: auth check
      const newTask = {
        type: "Box update",
        name: `Update box software`,
        description: `Triggered manually`,
        when: "asap",
        action: "box-update",
        done: false,
        arguments: undefined,
      };

      await models.entries.model.create({
        objectId: "system-task",
        data: newTask,
      });
    },
  },
  {
    key: "installApp",
    action: async (args, models, socket, socketInfo) => {
      // Todo: auth check
      const newTask = await models.entries.model.create({
        objectId: "system-task",
        data: {
          type: "App install",
          name: `Install ${args.appId}`,
          description: `Triggered manually`,
          when: "asap",
          action: "app-install",
          state: "Installing app",
          done: false,
          arguments: { appId: args.appId },
          progress: 0,
        },
      });
      socket.emit(`receive-${args.requestId}`, newTask._id);
    },
  },
  {
    key: "uninstallApp",
    action: async (args, models, socket, socketInfo) => {
      // Todo: auth check
      const newTask = await models.entries.model.create({
        objectId: "system-task",
        data: {
          type: "App uninstall",
          name: `Uninstall ${args.appId}`,
          description: `Triggered manually`,
          when: "asap",
          action: "app-uninstall",
          state: "Uninstalling app",
          done: false,
          arguments: { appId: args.appId, removeData: args.removeData },
          progress: 0,
        },
      });
      socket.emit(`receive-${args.requestId}`, newTask._id);
    },
  },
  {
    key: "search",
    action: async (args, models, socket, socketInfo) => {
      const { searchableIndex } = getIndex();
      const results = fuzzysort.go(args.query, searchableIndex, {
        key: "keywords",
        limit: 15,
      });
      const response = [];
      results.map((r) => {
        response.push({ label: r.obj.primary, key: r.obj.id, ...r });
      });
      socket.emit(`receive-${args.requestId}`, response);
    },
  },
  {
    key: "requestAction",
    action: async (args, models, socket, socketInfo) => {
      const requestArguments = args.args;
      const context = { args: args.args, models, socket, socketInfo };

      switch (args.action) {
        case "setUp2FA":
          socket.emit(`receive-${args.requestId}`, setUp2FA(context));
          break;
        case "compareSecretAndToken":
          compareSecretAndToken(
            requestArguments.secret,
            requestArguments.token,
            requestArguments.objectId,
            models,
            requestArguments.enabled_field,
            requestArguments.secret_field,
            requestArguments.qr_field,
            requestArguments.qr
          ).then((response) => socket.emit(response));
          break;
        default:
          systemLog("Unknown action");
          break;
      }
    },
  },
];

export const initServer = async (args, models, socket, socketInfo) => {
  const defaultModels = require("/AppBox/System/Server/src/Utils/DefaultData/models.json");
  await models.objects.model.insertMany(defaultModels);
  systemLog("Success: inserted default models");
  args.user.password = f.user.hashString(args.user.password);
  await models.entries.model.create({ objectId: "user", data: args.user });
  systemLog("Success: created default user");
  socket.send(`receive-${args.requestId}`, { success: true });
};
