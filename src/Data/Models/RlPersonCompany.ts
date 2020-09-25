export const required = {
  key: "rl-person-company",
  name: "Emploment",
  name_plural: "Employments",
  linked: true,
  linkedModels: [
    {
      label: "Person",
      value: "person",
    },
    {
      label: "Company",
      value: "companies",
    },
  ],
  primary: "name",
  icon: "FaLink",
  actions: {
    create: {
      layout: "default",
      type: "create",
    },
  },

  fields: {
    name: {
      name: "Name",
      type: "auto_name",
      typeArgs: {
        prefix: "PC",
        mode: "increment",
      },
      managed: true,
    },
    person: {
      name: "Person",
      type: "relationship",
      required: true,
      typeArgs: {
        relationshipTo: "people",
      },
      managed: true,
    },
    companies: {
      name: "Company",
      type: "relationship",
      required: true,
      typeArgs: {
        relationshipTo: "companies",
      },
      managed: true,
    },
    role: {
      name: "Role",
      type: "options",
      typeArgs: {
        options: [
          {
            label: "Director",
            key: "Director",
          },
          {
            label: "Marketing employee",
            key: "Marketing employee",
          },
          {
            label: "Cleaner",
            key: "Cleaner",
          },
          {
            label: "Hacker",
            key: "Hacker",
          },
          {
            label: "Intern",
            key: "Intern",
          },
          {
            label: "Owner",
            key: "Owner",
          },
          {
            label: "Programmer",
            key: "Programmer",
          },
          {
            label: "Designer",
            key: "Designer",
          },
          {
            label: "Manager",
            key: "Manager",
          },
        ],
        display: "dropdown",
      },
      managed: true,
    },
  },
};

export const optional = {
  indexed: true,
  preview: {
    fields: ["name", "person", "companies", "role"],
    enabled: true,
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
      fields: ["name", "person", "role", "companies"],
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
          id: "kf2r51ws",
          items: [
            {
              type: "AnimationItem",
              xs: 12,
              id: "kf2r5375",
              items: [
                {
                  type: "Paper",
                  xs: 12,
                  id: "kf2r56lv",
                  title: "Emploment",
                  withBigMargin: true,
                  key: "default",
                  items: [
                    {
                      type: "Field",
                      id: "40599ueykf2suw7t",
                      field: "person",
                    },
                    {
                      type: "Field",
                      xs: 12,
                      id: "40599ueykf2suw7u",
                      field: "companies",
                    },
                    {
                      type: "Field",
                      xs: 12,
                      id: "kf2zyfym",
                      field: "role",
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
    create: {
      layout: [
        {
          type: "Field",
          id: "40599ueykf2suw7t",
          field: "person",
        },
        {
          type: "Field",
          id: "40599ueykf2suw7u",
          field: "companies",
        },
        {
          type: "Field",
          xs: 12,
          id: "kf2zyzzq",
          field: "role",
        },
      ],
      buttons: [],
    },
  },
};
