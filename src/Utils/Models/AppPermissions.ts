//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "AppPermissions",
  new Schema({
    appId: String,
    objectId: String,
    permissions: [String],
  })
);
