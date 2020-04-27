//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "UserSettings",
  new Schema({
    userId: String,
    key: String,
    value: mongoose.Mixed,
  })
);
