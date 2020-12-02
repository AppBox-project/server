//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "SystemSettings",
  new Schema({
    key: String,
    value: Schema.Types.Mixed,
  })
);
