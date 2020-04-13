export default [
  {
    key: "updateBox",
    action: async (args, models, socket, socketInfo) => {
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
];
