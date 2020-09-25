export const required = {
  key: "companies",
  name: "Company",
  name_plural: "Companies",
  app: "System",
  icon: "FaBuilding",
  primary: "name",
  fields: {
    name: {
      name: "Name",
      required: true,
      unique: true,
      type: "input",
      managed: true,
    },
    banner: {
      name: "Banner",
      type: "picture",
      typeArgs: {
        asBanner: true,
      },
      managed: true,
    },
    logo: {
      name: "Logo",
      type: "picture",
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
  indexed: true,
  preview: {
    fields: ["name"],
    enabled: true,
    picture: "logo",
  },
  permissions: {
    read: ["known"],
    create: ["known"],
    modifyOwn: ["known"],
    write: ["known"],
    delete: ["known"],
    deleteOwn: ["known"],
    archive: ["known"],
    archiveOwn: ["known"],
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
          id: "kf4250o8",
          items: [
            {
              type: "GridContainer",
              xs: 12,
              id: "kf4252of",
              items: [
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kf425451",
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kf42599n",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "kf425p94",
                          title: "Company",
                          withBigMargin: true,
                          md: 3,
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "kf425wxb",
                              field: "name",
                              md: 3,
                              title: "Company",
                              withBigMargin: true,
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kf42sa1z",
                              field: "banner",
                              hideView: true,
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kf42schr",
                              field: "logo",
                              hideView: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  md: 9,
                },
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kf4255jg",
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kf425b3f",
                      items: [
                        {
                          type: "RelatedList",
                          xs: 12,
                          id: "kf4264p7",
                          title: "Employees",
                          object: "rl-person-company",
                          field: "companies",
                          displayfields: "person,role",
                          onlyVisibleWithResults: false,
                          displayCard: true,
                          withBigMargin: true,
                          addButton: true,
                          md: 3,
                        },
                      ],
                    },
                  ],
                  md: 3,
                },
              ],
            },
          ],
        },
      ],
      buttons: [],
    },
    create: {
      layout: [
        {
          type: "Field",
          xs: 12,
          id: "kf2snnza",
          field: "name",
          key: "create",
        },
      ],
      buttons: [],
    },
  },
};
