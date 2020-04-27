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
];
