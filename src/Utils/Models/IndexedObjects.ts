//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const { Schema } = mongoose;

const IndexedObjects = new Schema({
  id: String,
  label: String,
  model: String,
  searchable: [String],
});
mongoose.model("IndexedObjects", IndexedObjects);
