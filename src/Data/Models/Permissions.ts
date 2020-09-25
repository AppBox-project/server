export const required = {
  key: "permissions",
  name: "Permission",
  name_plural: "Permissions",
  __v: 0,
  icon: "FaLock",
  primary: "name",
  fields: {
    name: {
      name: "Name",
      type: "input",
      required: true,
      managed: true,
    },
    description: {
      name: "Description",
      type: "input",
      managed: true,
    },
  },
  actions: {
    create: {
      layout: "create",
      type: "create",
    },
  },

  app: "System",
};

export const optional = {
  indexed: true,
  indexed_fields: "description",
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
    fields: ["description"],
    enabled: true,
  },
  overviews: {
    default: {
      fields: ["name", "description"],
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
          id: "kajomdxq",
          items: [
            {
              type: "GridContainer",
              xs: 12,
              id: "kajomgf9",
              items: [
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kajomhyb",
                  md: 9,
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kajoms80",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "kajomz1x",
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "kajon1hf",
                              md: 3,
                              field: "name",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kajon5ah",
                              md: 3,
                              field: "description",
                            },
                          ],
                          withMargin: true,
                          hoverable: false,
                          withBigMargin: true,
                          withSmallMargin: false,
                          sideMarginOnly: false,
                          hideView: true,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kajomj0w",
                  md: 3,
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kajomtx0",
                      items: [
                        {
                          type: "RelatedList",
                          xs: 12,
                          id: "kajonaf5",
                          md: 3,
                          field: "permissions",
                          object: "roles",
                          title: "Roles with this permission",
                          displayfields: "name,description",
                          onlyVisibleWithResults: false,
                          displayCard: true,
                          cardMargin: true,
                          withMargin: true,
                          withBigMargin: true,
                          withSmallMargin: false,
                          sideMarginOnly: false,
                          hoverable: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      buttons: ["delete", "clone", "archive"],
      factsBar: ["name", "description"],
    },
    create: {
      layout: [
        {
          type: "Field",
          xs: 12,
          id: "kajooypa",
          key: "create",
          field: "name",
        },
        {
          type: "Field",
          xs: 12,
          id: "kajoozpo",
          key: "create",
          field: "description",
        },
      ],
    },
  },
};
