//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "AppSettings",
  new Schema({
    appKey: String,
    key: String,
    value: mongoose.Mixed,
  })
);
