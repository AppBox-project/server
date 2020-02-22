const mongoose = require("mongoose");

const { Schema } = mongoose;

mongoose.model(
  "Objects",
  new Schema({
    key: String,
    name: String,
    name_plural: String,
    fields: {},
    permissions: {
      read: [String],
      write: [String],
      delete: [String],
      create: [String]
    }
  })
);
