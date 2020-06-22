import f from "../Functions";
import { getIndex } from "../Utils/Index";
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
    key: "search",
    action: async (args, models, socket, socketInfo) => {
      const { searchableIndex } = getIndex();
      const results = fuzzysort.go(args.query, searchableIndex, {
        key: "keywords",
      });
      const response = [];
      results.map((r) => {
        response.push({ label: r.obj.primary, key: r.obj.id, ...r });
      });
      socket.emit(`receive-${args.requestId}`, response);
    },
  },
];

export const initServer = async (args, models, socket, socketInfo) => {
  const defaultModels = require("/AppBox/System/Server/src/Utils/DefaultData/models.json");
  await models.objects.model.insertMany(defaultModels);
  console.log("Success: inserted default models");
  args.user.password = f.user.hashString(args.user.password);
  await models.entries.model.create({ objectId: "user", data: args.user });
  console.log("Success: created default user");
  socket.send(`receive-${args.requestId}`, { success: true });
};
