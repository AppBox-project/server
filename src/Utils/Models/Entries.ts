//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "Entries",
  new Schema({
    key: String,
    objectId: String,
    data: Schema.Types.Mixed,
  })
);
