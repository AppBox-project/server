const mongoose = require("mongoose");

const { Schema } = mongoose;

mongoose.model(
  "Objects",
  new Schema({
    key: String,
    name: String,
    name_plural: String,
    overviews: {},
    fields: {},
    permissions: {
      read: [String],
      create: [String],
      modifyOwn: [String],
      write: [String],
      delete: [String],
      deleteOwn: [String]
    }
  })
);
