export const required = {
  key: "automations",
  name: "Automation",
  name_plural: "Automations",
  app: "System",
  icon: "FaRobot",
  primary: "name",
  fields: {
    name: {
      name: "Name",
      required: true,
      type: "input",
      managed: true,
    },
    triggers: {
      name: "Triggers",
      type: "data",
      managed: true,
    },
    actions: {
      name: "Actions",
      type: "data",
      managed: true,
    },
    description: {
      name: "Description",
      type: "richtext",
      managed: true,
    },
    active: {
      name: "Active",
      type: "boolean",
      managed: true,
    },
    type: {
      name: "Type",
      type: "options",
      typeArgs: {
        options: [
          {
            label: "Simple",
            key: "Simple",
          },
          {
            label: "Process",
            key: "Process",
          },
        ],
        display: "dropdown",
      },
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
    },
  },
};

export const optional = {
  permissions: {
    read: ["read-system-process"],
    create: ["create-system-process"],
    modifyOwn: ["known"],
    write: ["admin"],
    delete: ["admin"],
    deleteOwn: ["known"],
    archive: ["admin"],
    archiveOwn: ["known"],
  },
  indexed: true,
  indexed_fields: "description",
  preview: {
    fields: ["description"],
    enabled: true,
  },
  overviews: {
    default: {
      fields: ["name"],
      buttons: ["default", "create"],
      actions: ["delete"],
    },
  },
  layouts: {
    default: {
      layout: [
        {
          type: "AnimationContainer",
          xs: 12,
          id: "kcqe5n77",
          items: [
            {
              type: "AnimationItem",
              xs: 12,
              id: "kcqe5hrv",
              items: [
                {
                  type: "Paper",
                  xs: 12,
                  id: "kcqe5w5v",
                  items: [
                    {
                      type: "GridContainer",
                      xs: 12,
                      id: "kcqe61e3",
                      items: [
                        {
                          type: "GridItem",
                          xs: 6,
                          id: "kcqe63l7",
                          displayCard: true,
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "ke601ulh",
                              field: "key",
                              key: "key",
                              name: "Key",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kb9nsfjf",
                              key: "default",
                              name: "Key",
                              field: "name",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kbam5b9x",
                              key: "description",
                              name: "Description",
                              field: "description",
                            },
                          ],
                        },
                        {
                          type: "GridItem",
                          xs: 6,
                          id: "kcqe6hm2",
                          displayCard: true,
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "ke5pv14j",
                              field: "active",
                              key: "active",
                              name: "Active",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kbf7dl0m",
                              field: "triggers",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "kbf7dlx2",
                              field: "actions",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  title: "Process",
                  withMargin: true,
                  displayCard: true,
                  cardMargin: true,
                  hoverable: false,
                  withBigMargin: true,
                  withSmallMargin: false,
                  sideMarginOnly: true,
                },
              ],
            },
          ],
        },
      ],
    },
    create: {
      layout: [
        {
          type: "Field",
          xs: 12,
          id: "ke601hgl",
          field: "key",
          key: "key",
          name: "Key",
        },
        {
          type: "Field",
          xs: 12,
          id: "ke5ps0do",
          field: "name",
          key: "create",
        },
        {
          type: "Field",
          xs: 12,
          id: "ke5ps444",
          field: "description",
          key: "create",
        },
        {
          type: "Field",
          xs: 12,
          id: "ke5pv8jv",
          field: "active",
          key: "active",
          name: "Active",
        },
      ],
      buttons: [],
    },
  },
};
