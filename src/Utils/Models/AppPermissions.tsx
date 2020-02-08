const mongoose = require("mongoose");

const { Schema } = mongoose;

mongoose.model(
  "AppPermissions",
  new Schema({
    appId: String,
    objectId: String,
    permissions: [String]
  })
);
