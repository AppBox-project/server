// The read API allows you to read and search files
const executeReadApi = async (models, objectId, req, res, next) => {
  const model = await models.objects.model.findOne({ key: objectId });
  if (!model) {
    res.send("No-such-object");
  } else {
    let hasApi = false;
    if (model.api) {
      if (model.api.read) {
        if (model.api.read.active) {
          hasApi = true;
        }
      }
    }
    if (!hasApi) {
      res.send("Api-not-active");
    } else {
      let authentication = model.api.read.authentication
        ? model.api.read.authentication
        : "user";
      let authenticated = false;
      if (authentication === "user") {
        // Todo: authentication
        res.send("Todo: Authentication");
      } else {
        authenticated = true;
      }

      if (authenticated) {
        const results = await models.entries.model.find({ objectId });
        res.send(JSON.stringify(results));
      }
    }
  }
};
export { executeReadApi };
