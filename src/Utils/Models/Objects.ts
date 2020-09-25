//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

mongoose.model(
  "Objects",
  new Schema({
    objectId: String,
    data: Schema.Types.Mixed,
  })
);
