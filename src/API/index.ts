import { map } from "lodash";
import { baseUrl } from "../Utils/Utils/Utils";

// The read API allows you to read and search files
const executeReadApi = async (models, objectId, req, res, next) => {
  const model = await models.models.model.findOne({ key: objectId });
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
            if (key !== "baseUrl" && key != "addToEachObject") {
              // Skip these reserved values
              requirements[`data.${key}`] = value;
            }
          });
          objects = await models.objects.model.find({
            objectId,
            ...requirements,
          });
        } else {
          // No query params
          objects = await models.objects.model.find({ objectId });
        }
        // Modifiers to apply to data
        // Todo: improve logic
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
        // addToEachObject
        // Adds array to the existing object
        if (req.query.addToEachObject) {
          const addToEachObject = {};
          req.query.addToEachObject.split(";").map((k) => {
            const parts = k.split(":");
            addToEachObject[parts[0]] = parts[1];
          });
          objects.map((object, index) => {
            const newObject = object;
            newObject.data = { ...newObject.data, ...addToEachObject };
            objects[index] = newObject;
          });
        }

        res.send(JSON.stringify(objects));
      }
    }
  }
};
export { executeReadApi };
