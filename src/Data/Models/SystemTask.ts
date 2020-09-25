export const required = {
  key: "system-task",
  name: "System task",
  name_plural: "System tasks",
  icon: "FaLaptopCode",
  fields: {
    name: {
      name: "Name",
      type: "input",
      managed: true,
    },
    type: {
      name: "Type",
      type: "input",
      typeArgs: {
        options: [
          {
            label: "Box update",
            key: "Box update",
          },
        ],
        display: "dropdown",
        type: "text",
        managed: true,
      },
    },
    description: {
      name: "Description",
      type: "input",
      managed: true,
    },
    when: {
      name: "When",
      type: "input",
      managed: true,
    },
    action: {
      name: "Action",
      type: "input",
      managed: true,
    },
    done: {
      name: "Done",
      type: "boolean",
      managed: true,
    },
    arguments: {
      name: "Arguments",
      type: "data",
      managed: true,
    },
    progress: {
      name: "Progress",
      type: "input",
      typeArgs: {
        type: "number",
      },
      managed: true,
    },
    state: {
      name: "State",
      type: "input",
      managed: true,
    },
  },

  primary: "name",
  app: "System",
};

export const optional = {
  permissions: {
    read: ["known"],
    create: ["admin"],
    modifyOwn: ["known"],
    write: ["known"],
    delete: ["admin"],
    deleteOwn: ["known"],
    archive: ["admin"],
    archiveOwn: ["known"],
  },
  preview: {
    fields: ["action", "progress", "state"],
    enabled: true,
  },

  overviews: {
    default: {
      fields: ["name", "progress", "state", "done"],
      buttons: [],
      actions: ["delete"],
    },
  },
  layouts: {
    default: {
      layout: [],
      buttons: ["delete"],
      factsBar: ["name", "description", "done", "progress", "state"],
    },
  },
};
