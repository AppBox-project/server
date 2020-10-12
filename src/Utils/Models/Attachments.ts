//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "Attachments",
  new Schema({
    objectId: String,
    name: String,
    path: String,
  })
);
