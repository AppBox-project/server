//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "Models",
  new Schema(
    {
      key: String,
      name: String,
      primary: String,
      icon: String,
      app: String,
      name_plural: String,
      indexed: Boolean,
      indexed_fields: String,
      handlers: {},
      overviews: {},
      fields: {},
      api: {
        read: { active: Boolean, endpoint: String, authentication: String },
        create: { active: Boolean, endpoint: String, authentication: String },
        modifyOwn: {
          active: Boolean,
          endpoint: String,
          authentication: String,
        },
        write: { active: Boolean, endpoikeynt: String, authentication: String },
        deleteOwn: {
          active: Boolean,
          endpoint: String,
          authentication: String,
        },
        delete: { active: Boolean, endpoint: String, authentication: String },
      },
      layouts: {},
      actions: {},
      extensions: {},
      preview: { picture: String, fields: [String] },
      linked: Boolean,
      permissions: {
        read: [String],
        create: [String],
        modifyOwn: [String],
        write: [String],
        delete: [String],
        deleteOwn: [String],
        archive: [String],
        archiveOwn: [String],
      },
    },
    { strict: false }
  )
);
