mongoose.model(
  "Entries",
  new Schema({
    key: String,
    objectId: String,
    data: Schema.Types.Mixed,
  })
);
