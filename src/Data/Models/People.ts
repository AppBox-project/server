export const required = {
  key: "people",
  name: "Person",
  name_plural: "People",
  __v: 0,
  icon: "FaUserFriends",
  primary: "full_name",
  fields: {
    first_name: {
      name: "First name",
      required: true,
      type: "input",
      managed: true,
    },
    last_name: {
      name: "Last name",
      type: "input",
      managed: true,
    },
    full_name: {
      name: "Full name",
      type: "formula",
      typeArgs: {
        formula: "{{ first_name }} {{ last_name }} ",
        type: "text",
      },
      managed: true,
    },
    gender: {
      name: "Gender",
      type: "options",
      typeArgs: {
        options: [
          {
            label: "Male",
            key: "Male",
          },
          {
            label: "Female",
            key: "Female",
          },
          {
            label: "Unknown",
            key: "Unknown",
          },
          {
            label: "Other",
            key: "Other",
          },
        ],
      },
      default: "Male",
      managed: true,
    },
    picture: {
      name: "Picture",
      type: "picture",
      managed: true,
    },
    address: {
      name: "Address",
      type: "address",
      managed: true,
    },
    email: {
      name: "E-mail",
      unique: false,
      type: "input",
      typeArgs: {
        type: "email",
      },
      validations: ["isEmail"],
      managed: true,
    },
    phone: {
      name: "Phone",
      type: "input",
      typeArgs: {
        type: "phone",
      },
      managed: true,
    },
    birthday: {
      name: "Birthday",
      type: "date",
      managed: true,
    },
    age: {
      name: "Age",
      type: "formula",
      typeArgs: {
        formula: "{{ differenceInYears(TODAY, birthday) }}",
        type: "number",
      },
      managed: true,
    },
    notes: {
      name: "Notes",
      type: "richtext",
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
  indexed: true,
  indexed_fields: "address,email,phone",
  preview: {
    fields: ["email", "age", "address"],
    picture: "picture",
    enabled: true,
  },
  overviews: {
    default: {
      fields: ["picture", "full_name", "gender", "age", "email"],
      buttons: ["create"],
      actions: ["delete"],
    },
  },
  layouts: {
    default: {
      layout: [
        {
          type: "GridContainer",
          xs: 12,
          id: "kaczd1rw",
          items: [
            {
              type: "GridItem",
              xs: 12,
              id: "kaczd4j9",
              items: [
                {
                  type: "AnimationItem",
                  xs: 12,
                  id: "kaczd9m6",
                  items: [
                    {
                      type: "Paper",
                      xs: 6,
                      id: "kaczdtgt",
                      items: [
                        {
                          type: "GridContainer",
                          xs: 12,
                          id: "kdd8xhz4",
                          items: [
                            {
                              type: "GridItem",
                              xs: 6,
                              id: "kdd8xk5b",
                              items: [
                                {
                                  type: "Field",
                                  xs: 12,
                                  id: "kaczestn",
                                  key: "picture",
                                  name: "Picture",
                                  field: "first_name",
                                  newOptions: "Male,Female,Unknown,Other",
                                  md: 3,
                                },
                              ],
                            },
                            {
                              type: "GridItem",
                              xs: 6,
                              id: "kdd8xw1o",
                              items: [
                                {
                                  type: "Field",
                                  xs: 12,
                                  id: "kaczeuun",
                                  key: "picture",
                                  name: "Picture",
                                  field: "last_name",
                                  newOptions: "Male,Female,Unknown,Other",
                                  md: 3,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "Field",
                          xs: 12,
                          id: "kaczeww7",
                          key: "picture",
                          name: "Picture",
                          field: "gender",
                          newOptions: "Male,Female,Unknown,Other",
                          md: 3,
                        },
                        {
                          type: "Field",
                          xs: 12,
                          id: "ke8n1ied",
                          field: "notes",
                          name: "Notes",
                          key: "notes",
                        },
                      ],
                      title: "About the person",
                      field: "permission___view",
                      withMargin: true,
                      hoverable: false,
                      withBigMargin: true,
                      withSmallMargin: false,
                      sideMarginOnly: false,
                    },
                  ],
                },
              ],
              key: "picture",
              name: "Picture",
              field: "gender",
              newOptions: "Male,Female,Unknown,Other",
              md: 9,
            },
            {
              type: "GridItem",
              xs: 12,
              id: "kaczd644",
              items: [
                {
                  type: "AnimationItem",
                  xs: 12,
                  id: "kaczdca8",
                  items: [
                    {
                      type: "Paper",
                      xs: 6,
                      id: "kaczdwr0",
                      items: [
                        {
                          type: "Field",
                          xs: 12,
                          id: "kaczkklv",
                          key: "picture",
                          name: "Picture",
                          field: "picture",
                          newOptions: "Male,Female,Unknown,Other",
                          md: 3,
                        },
                        {
                          type: "Field",
                          xs: 12,
                          id: "kb5a5gcb",
                          key: "phone",
                          name: "Phone",
                          field: "phone",
                          hideView: true,
                        },
                        {
                          type: "Field",
                          xs: 12,
                          id: "kb3p979v",
                          key: "address",
                          name: "Address",
                          field: "address",
                          hideView: true,
                        },
                        {
                          type: "Field",
                          xs: 12,
                          id: "kcth82xn",
                          field: "birthday",
                        },
                        {
                          type: "Field",
                          xs: 12,
                          id: "kb5a5ew6",
                          key: "phone",
                          name: "Phone",
                          field: "email",
                          hideView: true,
                        },
                      ],
                      title: "Further details",
                      field: "permission___view",
                      withMargin: true,
                      hoverable: false,
                      withBigMargin: true,
                      withSmallMargin: false,
                      sideMarginOnly: false,
                      hideView: true,
                    },
                  ],
                },
                {
                  type: "AnimationItem",
                  xs: 12,
                  id: "kf41zyag",
                  items: [
                    {
                      type: "RelatedList",
                      xs: 12,
                      id: "kf4201m4",
                      title: "Employers",
                      object: "rl-person-company",
                      field: "person",
                      displayfields: "companies,role",
                      onlyVisibleWithResults: false,
                      displayCard: true,
                      withBigMargin: true,
                      addButton: true,
                    },
                  ],
                },
              ],
              key: "picture",
              name: "Picture",
              field: "gender",
              newOptions: "Male,Female,Unknown,Other",
              md: 3,
            },
          ],
        },
      ],
      buttons: ["delete", "clone", "archive"],
      factsBar: ["picture", "full_name", "email", "gender", "age", "address"],
    },
    create: {
      layout: [
        {
          type: "FieldGrid",
          xs: 12,
          id: "kdbnob72",
          title: "New person",
          layout: [
            {
              id: "kdbnohud",
              name: "New person",
              columns: 2,
              showTitle: true,
              defaultExpanded: true,
              items: ["first_name", "last_name", "gender", "birthday"],
            },
            {
              id: "kdbnouip",
              name: "Contact",
              columns: 1,
              showTitle: true,
              defaultExpanded: true,
              items: ["address", "phone", "email"],
            },
          ],
        },
      ],
      buttons: [],
    },
  },
};
