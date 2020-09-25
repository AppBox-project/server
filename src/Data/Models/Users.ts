export const required = {
  key: "users",
  name: "User",
  primary: "username",
  name_plural: "Users",
  fields: {
    username: {
      name: "Username",
      required: true,
      unique: true,
      type: "input",
      managed: true,
    },
    password: {
      name: "Password",
      required: true,
      type: "input",
      typeArgs: {
        type: "password",
      },
      transformations: ["hash"],
      managed: true,
    },
    email: {
      name: "Email",
      type: "input",
      typeArgs: {
        type: "email",
      },
      required: true,
      unique: true,
      validations: ["isEmail"],
      managed: true,
    },
    first_name: {
      name: "First name",
      type: "formula",
      typeArgs: {
        formula: "{{ person_r.first_name }}",
        type: "text",
      },
      managed: true,
    },
    last_name: {
      name: "Last name",
      type: "formula",
      typeArgs: {
        formula: "{{ person_r.last_name }}",
        type: "text",
      },
      managed: true,
    },
    full_name: {
      name: "Full name",
      type: "formula",
      typeArgs: {
        formula: "{{ first_name }} {{ last_name }}",
        type: "text",
      },
      managed: true,
    },
    picture: {
      name: "Picture",
      type: "formula",
      typeArgs: {
        formula: "{{ person_r.picture }}",
        type: "picture",
      },
      managed: true,
    },
    roles: {
      name: "Roles",
      type: "relationship_m",
      typeArgs: {
        relationshipTo: "roles",
      },
      managed: true,
    },
    person: {
      name: "Person",
      type: "relationship",
      typeArgs: {
        relationshipTo: "people",
      },
      managed: true,
      required: true,
      unique: true,
    },
    mfa_enabled: {
      name: "MFA enabled",
      type: "boolean",
      readonly: true,
      typeArgs: {
        readonly: true,
      },
      managed: true,
    },
    mfa_secret: {
      name: "MFA secret",
      type: "input",
      readonly: true,
      typeArgs: {
        readonly: true,
      },
      conditions: {
        conditions: [
          {
            field: "mfa_enabled",
            operator: "equals",
            value: true,
          },
        ],
      },
      managed: true,
    },
    mfa_qr: {
      name: "MFA QR",
      type: "qr",
      readonly: true,
      typeArgs: {
        readonly: true,
        type: "text",
      },
      conditions: {
        conditions: [
          {
            field: "mfa_enabled",
            operator: "equals",
            value: true,
          },
        ],
      },
      managed: true,
    },
  },
  actions: {
    create: {
      layout: "create",
      type: "create",
    },
  },

  icon: "FaUsers",
  app: "System",

  extensions: {
    "2fa": {
      name: "2FA",
      app_name: "AppBox",
      "2fa_enabled_field": "mfa_enabled",
      "2fa_secret_field": "mfa_secret",
      "2fa_qr_field": "mfa_qr",
      username_field: "first_name",
      active: true,
    },
  },
};
export const optional = {
  indexed: true,
  indexed_fields: "full_name",
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
  overviews: {
    default: {
      fields: ["username", "full_name", "email", "roles"],
      buttons: ["create"],
      actions: ["delete"],
    },
  },
  api: {
    read: {
      "0": "read",
      active: false,
    },
  },
  preview: {
    fields: ["full_name", "email", "person"],
    icon: "picture",
    picture: "picture",
    enabled: true,
  },
  layouts: {
    create: {
      layout: [
        {
          type: "Field",
          xs: 12,
          id: "ka8gkjo5",
          key: "create",
          field: "username",
        },
        {
          type: "Field",
          xs: 12,
          id: "ka8gonck",
          key: "create",
          field: "password",
        },
        {
          type: "Field",
          xs: 12,
          id: "ka8god8m",
          key: "create",
          field: "email",
        },
        {
          type: "Field",
          xs: 12,
          id: "ka8gortq",
          key: "create",
          field: "first_name",
        },
        {
          type: "Field",
          xs: 12,
          id: "ka8gosjn",
          key: "create",
          field: "last_name",
        },
        {
          type: "Field",
          xs: 12,
          id: "kajp4b1p",
          key: "roles",
          name: "Roles",
          field: "roles",
        },
        {
          type: "Field",
          xs: 12,
          id: "kcrrf1a8",
          field: "person",
        },
      ],
    },
    default: {
      layout: [
        {
          type: "AnimationContainer",
          xs: 12,
          id: "ka9m7kuo",
          items: [
            {
              type: "GridContainer",
              xs: 12,
              id: "ka9m7ont",
              items: [
                {
                  type: "GridItem",
                  xs: 12,
                  id: "ka9m7ziv",
                  md: 9,
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "ka9m8hmc",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "ka9m8q1g",
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "ka9m8x6j",
                              md: 3,
                              field: "username",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "ka9m9490",
                              md: 3,
                              field: "email",
                            },
                            {
                              type: "Field",
                              xs: 12,
                              id: "ka9m978n",
                              md: 3,
                              field: "password",
                            },
                            {
                              type: "GridContainer",
                              xs: 12,
                              id: "ked1tmrq",
                              items: [
                                {
                                  type: "GridItem",
                                  xs: 6,
                                  id: "ked1tq6r",
                                  items: [
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "ka9m9oes",
                                      md: 3,
                                      field: "first_name",
                                    },
                                  ],
                                },
                                {
                                  type: "GridItem",
                                  xs: 6,
                                  id: "ked1trqd",
                                  items: [
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "ka9m9qsg",
                                      md: 3,
                                      field: "last_name",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          title: "About user",
                          withMargin: false,
                          withSmallMargin: false,
                          sideMargin: true,
                          oneSideMargin: true,
                          hoverable: false,
                          withBigMargin: true,
                          sideMarginOnly: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "GridItem",
                  xs: 12,
                  id: "ka9m8290",
                  md: 3,
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "ka9m8kqi",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "ka9m8to1",
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "ka9m9zre",
                              md: 3,
                              field: "person",
                            },
                          ],
                          title: "Info",
                          withMargin: false,
                          withSmallMargin: false,
                          sideMargin: true,
                          oneSideMargin: true,
                          hoverable: false,
                          withBigMargin: true,
                          sideMarginOnly: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "GridItem",
                  xs: 12,
                  id: "kcnon8zp",
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kcnoncuz",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "kcnong21",
                          title: "Permissions",
                          items: [
                            {
                              type: "Field",
                              xs: 12,
                              id: "kcnonrxp",
                              field: "roles",
                              title: "Permissions",
                            },
                          ],
                          withMargin: false,
                          withSmallMargin: false,
                          sideMargin: true,
                          oneSideMargin: true,
                          hoverable: false,
                          withBigMargin: true,
                          sideMarginOnly: false,
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
      buttons: ["clone", "archive"],
      factsBar: ["picture", "full_name", "username", "email"],
    },
    system: {
      layout: [
        {
          type: "TabContainer",
          xs: 12,
          id: "kf1htq1w",
          identifier: "page",
          field: "username",
          hideView: false,
          md: 9,
          items: [
            {
              type: "TabItem",
              xs: 12,
              id: "kf1htw1d",
              title: "Information",
              identifier: "info",
              field: "username",
              hideView: false,
              md: 9,
              items: [
                {
                  type: "AnimationContainer",
                  xs: 12,
                  id: "kf1hugpt",
                  items: [
                    {
                      type: "GridContainer",
                      xs: 12,
                      id: "kf1huq75",
                      items: [
                        {
                          type: "GridItem",
                          xs: 12,
                          id: "kf1huyo9",
                          items: [
                            {
                              type: "AnimationItem",
                              xs: 12,
                              id: "kf1hvgfx",
                              items: [
                                {
                                  type: "FactsBar",
                                  xs: 12,
                                  id: "kf1hvkf1",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "GridItem",
                          xs: 12,
                          id: "kf1hw44g",
                          md: 9,
                          field: "username",
                          hideView: false,
                          identifier: "settings",
                          title: "Settings",
                          items: [
                            {
                              type: "AnimationItem",
                              xs: 12,
                              id: "kf1hwdgk",
                              items: [
                                {
                                  type: "Paper",
                                  xs: 12,
                                  id: "kf1hwfi0",
                                  title: "Information",
                                  withBigMargin: true,
                                  hideView: false,
                                  field: "username",
                                  md: 3,
                                  identifier: "settings",
                                  items: [
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "kf1hzo8i",
                                      field: "username",
                                      hideView: false,
                                      noLabel: false,
                                      md: 3,
                                      identifier: "settings",
                                      title: "Settings",
                                      withBigMargin: true,
                                    },
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "kf1hztzj",
                                      field: "password",
                                      hideView: false,
                                      noLabel: false,
                                      md: 3,
                                      identifier: "settings",
                                      title: "Settings",
                                      withBigMargin: true,
                                    },
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "kf1hzzi4",
                                      field: "email",
                                      hideView: false,
                                      noLabel: false,
                                      md: 3,
                                      identifier: "settings",
                                      title: "Settings",
                                      withBigMargin: true,
                                    },
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "kf1i0f5j",
                                      field: "person",
                                      hideView: false,
                                      noLabel: false,
                                      md: 3,
                                      identifier: "settings",
                                      title: "Settings",
                                      withBigMargin: true,
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "GridItem",
                          xs: 12,
                          id: "kf1hwuoy",
                          md: 3,
                          field: "username",
                          hideView: false,
                          identifier: "settings",
                          title: "Settings",
                          withBigMargin: true,
                          items: [
                            {
                              type: "AnimationItem",
                              xs: 12,
                              id: "kf1hxchu",
                              items: [
                                {
                                  type: "Paper",
                                  xs: 12,
                                  id: "kf1hxg9z",
                                  title: "2FA",
                                  withBigMargin: true,
                                  field: "username",
                                  md: 3,
                                  identifier: "settings",
                                  items: [
                                    {
                                      type: "Field",
                                      xs: 12,
                                      id: "kf1hz8ja",
                                      field: "mfa_qr",
                                      hideView: false,
                                      noLabel: true,
                                      md: 3,
                                      identifier: "settings",
                                      title: "Settings",
                                      withBigMargin: true,
                                      hideEdit: false,
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
                },
              ],
            },
            {
              type: "TabItem",
              xs: 12,
              id: "kf1htyuz",
              title: "Settings",
              identifier: "settings",
              field: "username",
              hideView: false,
              md: 9,
              items: [
                {
                  type: "AnimationContainer",
                  xs: 12,
                  id: "kf1hulnr",
                  items: [
                    {
                      type: "AnimationItem",
                      xs: 12,
                      id: "kf1hyl1c",
                      items: [
                        {
                          type: "Paper",
                          xs: 12,
                          id: "kf1hynnm",
                          title: "Settings",
                          withBigMargin: true,
                          hideView: false,
                          field: "username",
                          md: 3,
                          identifier: "settings",
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
      buttons: ["2fa-configure"],
      factsBar: ["picture", "full_name", "username", "roles", "person"],
    },
  },
};
