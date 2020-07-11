import { map } from "lodash";
import { baseUrl } from "../Utils/Utils/Utils";

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
        let objects;
        if (req.query) {
          const requirements = {};
          map(req.query, (value, key) => {
            if (key !== "baseUrl") {
              // Skip these reserved values
              requirements[`data.${key}`] = value;
            }
          });
          objects = await models.entries.model.find({
            objectId,
            ...requirements,
          });
        } else {
          // No query params
          objects = await models.entries.model.find({ objectId });
        }
        // Modifiers to apply to data
        map(model.fields, (field, fieldKey) => {
          // Modifiers to apply to data
          const modifiers = [];
          if (field.type === "picture") {
            objects.map((object) => {
              object.data[fieldKey] = {
                url:
                  (req.query.baseUrl
                    ? req.query.baseUrl === "base"
                      ? baseUrl
                      : req.query.baseUrl
                    : "") + object.data[fieldKey],
              };
            });
          }
        });

        res.send(JSON.stringify(objects));
      }
    }
  }
};
export { executeReadApi };
