export const required = {
  key: "roles",
  name: "Role",
  name_plural: "Roles",
  icon: "FaUserShield",
  primary: "name",
  fields: {
    name: {
      name: "Name",
      required: true,
      unique: true,
      type: "input",
    },
    description: {
      name: "Description",
      type: "input",
    },
    permissions: {
      name: "Permissions",
      type: "relationship_m",
      typeArgs: {
        relationshipTo: "permissions",
      },
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
  permissions: {
    read: ["known"],
    create: ["admin"],
    modifyOwn: ["known"],
    write: ["known"],
    delete: ["admin"],
    deleteOwn: ["known"],
    archive: [],
    archiveOwn: [],
  },
  indexed: true,
  indexed_fields: "description",
  preview: {
    fields: ["description", "permissions"],
    enabled: true,
  },
  overviews: {
    default: {
      fields: ["name", "description", "permissions"],
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
          id: "kajp69s0",
          items: [
            {
              type: "GridContainer",
              xs: 12,
              id: "kajp6bhb",
              items: [
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kajp6dmo",
                  key: "create",
                  name: "Roles",
                  field: "permissions",
                  md: 9,
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kajp78pm",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "kajp85s9",
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "kajp89j9",
                              key: "create",
                              name: "Roles",
                              field: "name",
                              md: 3,
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kajp8b54",
                              key: "create",
                              name: "Roles",
                              field: "description",
                              md: 3,
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kajp8cd9",
                              key: "create",
                              name: "Roles",
                              field: "permissions",
                              md: 3,
                            },
                          ],
                          withMargin: true,
                          hoverable: false,
                          withBigMargin: true,
                          withSmallMargin: true,
                          sideMarginOnly: true,
                          hideView: true,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kajp6ezv",
                  key: "create",
                  name: "Roles",
                  field: "permissions",
                  md: 3,
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kajp7ajt",
                      items: [
                        {
                          type: "RelatedList",
                          xs: 12,
                          id: "kajp8nrv",
                          key: "create",
                          name: "Roles",
                          field: "roles",
                          md: 3,
                          title: "Users with this role",
                          object: "user",
                          displayfields: "full_name",
                          onlyVisibleWithResults: false,
                          displayCard: true,
                          cardMargin: true,
                          withMargin: true,
                          withBigMargin: false,
                          withSmallMargin: true,
                          sideMarginOnly: true,
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
      factsBar: ["name", "description", "permissions"],
    },
    create: {
      layout: [
        {
          type: "Field",
          xs: 12,
          id: "kcnzaiih",
          field: "name",
          key: "create",
        },
        {
          type: "Field",
          xs: 12,
          id: "kcnzaksu",
          field: "description",
          key: "create",
        },
        {
          type: "Field",
          xs: 12,
          id: "kcnzam5f",
          field: "permissions",
          key: "create",
        },
      ],
    },
  },
};
