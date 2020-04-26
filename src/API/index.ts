import { map } from "lodash";

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
        let results;
        if (req.query) {
          const requirements = {};
          map(req.query, (value, key) => {
            requirements[`data.${key}`] = value;
          });
          results = await models.entries.model.find({
            objectId,
            ...requirements,
          });
        } else {
          // No query params
          results = await models.entries.model.find({ objectId });
        }
        res.send(JSON.stringify(results));
      }
    }
  }
};
export { executeReadApi };
