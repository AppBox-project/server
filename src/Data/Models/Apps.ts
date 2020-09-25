export const required = {
  key: "apps",
  name: "App",
  name_plural: "Apps",
  fields: {
    name: {
      name: "Name",
      type: "input",
      required: true,
      managed: true,
    },
    color: {
      name: "Color",
      required: true,
      type: "color",
      managed: true,
    },
    id: {
      name: "ID",
      required: true,
      unique: true,
      type: "input",
      managed: true,
    },
    core: {
      name: "Core",
      type: "boolean",
      managed: true,
    },
    root: {
      name: "Root",
      type: "boolean",
      managed: true,
    },
    mobileSettings: {
      name: "Mobile settings",
      type: "data",
      managed: true,
    },
    icon: {
      name: "Icon",
      type: "input",
      managed: true,
    },
    permission___view: {
      name: "View permission",
      type: "input",
      managed: true,
    },
    widgets: {
      name: "Widgets",
      type: "boolean",
      managed: true,
    },
  },

  primary: "name",
  actions: {
    create: {
      layout: "default",
      type: "create",
    },
  },
  icon: "FaGripHorizontal",
  app: "System",
  indexed: true,
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
    fields: ["name", "id", "color"],
    enabled: true,
  },

  layouts: {
    default: {
      layout: [
        {
          type: "AnimationContainer",
          xs: 12,
          id: "kf6wq7bt",
          items: [
            {
              type: "AnimationItem",
              xs: 12,
              id: "kf6wq937",
              items: [
                {
                  type: "Paper",
                  xs: 12,
                  id: "kf6wqc5g",
                  title: "App",
                  withBigMargin: true,
                  items: [
                    {
                      type: "FieldGrid",
                      xs: 12,
                      id: "kf6wqogg",
                      title: "App",
                      layout: [
                        {
                          id: "kf6wqqjr",
                          name: "Info",
                          columns: 2,
                          showTitle: true,
                          defaultExpanded: false,
                          items: ["name", "id", "permission___view", "widgets"],
                        },
                        {
                          id: "kf6wr5az",
                          name: "Settings",
                          columns: 2,
                          showTitle: true,
                          defaultExpanded: true,
                          items: [
                            "color",
                            "core",
                            "root",
                            "mobileSettings",
                            "icon",
                          ],
                        },
                      ],
                      withBigMargin: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  overviews: {
    default: {
      fields: ["name", "color", "id"],
      buttons: ["create"],
      actions: ["delete"],
    },
  },
};
