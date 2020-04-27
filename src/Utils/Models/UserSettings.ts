//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "UserSettings",
  new Schema({
    username: String,
    key: String,
    value: mongoose.Mixed,
  })
);
