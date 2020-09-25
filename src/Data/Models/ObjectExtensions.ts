export const required = {
  key: "object-extensions",
  name: "Object extension",
  name_plural: "Object extensions",
  app: "System",
  icon: "FaPlug",
  primary: "name",
  fields: {
    name: {
      name: "Name",
      required: true,
      unique: true,
      type: "input",
      managed: true,
    },
    key: {
      name: "Key",
      unique: true,
      required: true,
      type: "input",
      managed: true,
    },
  },
  actions: {
    create: {
      layout: "default",
      type: "create",
    },
  },
};

export const optional = {
  permissions: {
    read: ["known"],
    create: ["admin"],
    modifyOwn: ["known"],
    write: ["admin"],
    delete: ["admin"],
    deleteOwn: ["known"],
    archive: ["admin"],
    archiveOwn: ["known"],
  },
  preview: {
    fields: [],
  },
  overviews: {
    default: {
      fields: ["name"],
      buttons: ["create"],
      actions: ["delete"],
    },
  },
  layouts: {
    default: {
      layout: [
        {
          type: "AnimationContainer",
          xs: 12,
          id: "kesk2rrr",
          items: [
            {
              type: "AnimationItem",
              xs: 12,
              id: "kesk2u25",
              items: [
                {
                  type: "Paper",
                  xs: 12,
                  id: "kesk2vcj",
                  withBigMargin: true,
                  key: "key",
                  name: "Key",
                  items: [
                    {
                      type: "Field",
                      xs: 12,
                      id: "kesjwye9",
                      field: "name",
                      key: "default",
                      name: "Name",
                    },
                    {
                      type: "Field",
                      xs: 12,
                      id: "kesk30dy",
                      field: "key",
                      key: "key",
                      name: "Key",
                      withBigMargin: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      buttons: [],
    },
  },
};
