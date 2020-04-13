mongoose.model(
  "AppPermissions",
  new Schema({
    appId: String,
    objectId: String,
    permissions: [String],
  })
);
