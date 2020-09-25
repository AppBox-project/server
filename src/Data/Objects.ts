export const required = [
  {
    _id: {
      $oid: "5ebe6e32fbbc234bb4a0cfd7",
    },
    objectId: "apps",
    data: {
      name: "Data Explorer",
      id: "data-explorer",
      core: true,
      root: true,
      color: {
        r: 20,
        g: 126,
        b: 133,
        a: 1,
      },
      mobileSettings: {
        actionsDisplayAs: "menu",
      },
      icon: "FaCompass",
      widgets: true,
    },
  },
  {
    _id: {
      $oid: "5ebe6e53fbbc234bb4a0cfd8",
    },
    objectId: "apps",
    data: {
      name: "Object Manager",
      id: "object-manager",
      core: true,
      root: true,
      color: {
        r: 32,
        g: 89,
        b: 113,
        a: 1,
      },
      icon: "FaCubes",
      mobileSettings: {
        actionsDisplayAs: "menu",
      },
      permission___view: "admin",
    },
  },
  {
    _id: {
      $oid: "5ebe6e9afbbc234bb4a0cfda",
    },
    objectId: "apps",
    data: {
      name: "App Hub",
      id: "app-hub",
      core: true,
      color: {
        r: 232,
        g: 139,
        b: 69,
        a: 1,
      },
      icon: "FaStoreAlt",
      mobileSettings: {
        actionsDisplayAs: "bottom-navigation",
      },
      permission___view: "admin",
    },
  },
  {
    _id: {
      $oid: "5ebe6e9afbbc234bb4a0cfda",
    },
    objectId: "apps",
    data: {
      name: "App Hub",
      id: "app-hub",
      core: true,
      color: {
        r: 232,
        g: 139,
        b: 69,
        a: 1,
      },
      icon: "FaStoreAlt",
      mobileSettings: {
        actionsDisplayAs: "bottom-navigation",
      },
      permission___view: "admin",
    },
  },
  {
    _id: {
      $oid: "5ec2af40cd836f336c11e1e1",
    },
    data: {
      name: "Settings",
      id: "settings",
      core: true,
      color: {
        r: 72,
        g: 82,
        b: 99,
        a: 1,
      },
      icon: "FaTools",
      permission___view: "admin",
      root: true,
      mobileSettings: {
        actionsDisplayAs: "menu",
      },
    },
    objectId: "apps",
    __v: 0,
  },
  {
    _id: {
      $oid: "5f196d357ec1ec39f8ac49c7",
    },
    data: {
      name: "Calendar",
      id: "calendar",
      core: true,
      color: {
        r: 108,
        g: 180,
        b: 133,
        a: 1,
      },
      icon: "FaCalendarDay",
      root: true,
    },
    objectId: "apps",
    __v: 0,
  },
  {
    _id: {
      $oid: "5ec92a260c0cc81eefb9154c",
    },
    data: {
      name: "user",
      description: "Allows for common user actions.",
    },
    objectId: "permissions",
    __v: 0,
  },
  {
    _id: {
      $oid: "5ec92a550c0cc81eefb9154d",
    },
    data: {
      name: "admin",
      description: "Allows for most admin actions.",
    },
    objectId: "permissions",
    __v: 0,
  },
  {
    _id: {
      $oid: "5ee120754052e80183dec284",
    },
    data: {
      name: "read-system-process",
      description: "Allows reading of system processes",
    },
    objectId: "permissions",
    __v: 0,
  },
  {
    _id: {
      $oid: "5ee1209f4052e80183dec285",
    },
    data: {
      name: "create-system-process",
      description: "Allows for creation of system processes",
    },
    objectId: "permissions",
    __v: 0,
  },
  {
    _id: {
      $oid: "5ee121464052e80183dec286",
    },
    data: {
      name: "nobody",
      description: "Nobody can perform this action.",
    },
    objectId: "permissions",
    __v: 0,
  },
];

export const optional = [
  {
    _id: {
      $oid: "5ec92a7c0c0cc81eefb9154e",
    },
    data: {
      name: "User",
      description: "General user of the system",
      permissions: ["5ec92a260c0cc81eefb9154c", "5eca4512c951e2108f28b28d"],
    },
    objectId: "roles",
    __v: 0,
  },
  {
    _id: {
      $oid: "5ec92a880c0cc81eefb9154f",
    },
    data: {
      name: "Admin",
      description: "Administrators of the system",
      permissions: [
        "5ec92a550c0cc81eefb9154d",
        "5ec96b1d8ac32036bfeabc7a",
        "5ee120754052e80183dec284",
        "5ee1209f4052e80183dec285",
      ],
    },
    objectId: "roles",
    __v: 0,
  },
  {
    _id: {
      $oid: "5f41220ee5870d04f13d54d4",
    },
    data: {
      active: true,
      name: "Auto update",
      description: "<p>Automatically updates the software overnight.</p>",
      __v: 0,
      _id: "5f41220ee5870d04f13d54d4",
      objectId: "automations",
      triggers: [
        {
          type: "date",
          trigger: "day",
        },
      ],
      actions: [
        {
          args: {
            model: "system-task",
            object: {
              type: "Box update",
              name: "Update software",
              description: "Triggered by the automator",
              when: "asap",
              action: "box-update",
              progress: 0,
              state: "Planned",
            },
          },
          type: "InsertObject",
        },
      ],
      key: "auto-update",
    },
    objectId: "automations",
    __v: 8,
  },
  {
    _id: {
      $oid: "5f415dd443478906166a43a4",
    },
    data: {
      name: "Auto backup",
      description: "<p>Performs a weekly backup of the database.</p>",
      active: true,
      actions: [
        {
          args: {
            model: "system-task",
            object: {
              type: "Database export",
              name: "Weekly backup",
              description: "Triggered by the automator",
              when: "asap",
              action: "backup",
              progress: 0,
              state: "Planned",
            },
          },
          type: "InsertObject",
        },
      ],
      triggers: [
        {
          type: "date",
          trigger: "week",
        },
      ],
      key: "auto-backup",
    },
    objectId: "automations",
    __v: 1,
  },
  {
    _id: {
      $oid: "5f415eb143478906166a43a5",
    },
    data: {
      active: true,
      name: "Task cleanup",
      description: "<p>Cleans up all finished tasks every night at 1.</p>",
      actions: [
        {
          args: {
            model: "system-task",
            filter: {
              "data.done": true,
            },
          },
          type: "DeleteObjects",
        },
      ],
      triggers: [
        {
          type: "date",
          trigger: "0 0 1 * * *",
        },
      ],
      key: "task-cleanup",
      type: "Simple",
    },
    objectId: "automations",
    __v: 6,
  },
  {
    _id: {
      $oid: "5f56334f73b49305d1ea3443",
    },
    data: {
      name: "MFA",
      key: "2fa",
    },
    objectId: "object-extensions",
    __v: 0,
  },
];
