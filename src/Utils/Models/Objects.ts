//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "Objects",
  new Schema(
    {
      key: String,
      name: String,
      primary: String,
      name_plural: String,
      overviews: {},
      buttons: {},
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
      permissions: {
        read: [String],
        create: [String],
        modifyOwn: [String],
        write: [String],
        delete: [String],
        deleteOwn: [String],
      },
    },
    { strict: false }
  )
);
