const mongoose = require("mongoose");

const { Schema } = mongoose;

mongoose.model(
  "Entries",
  new Schema({
    key: String,
    objectId: String,
    data: mongoose.Mixed
  })
);
