import { map } from "lodash";
import { checkPersonToken } from "../Utils/Functions/User";
import sanitizeString from "../Utils/Functions/SanitizeString";
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
      res.send(JSON.stringify({ success: false, reason: "api-not-active" }));
    } else {
      let authentication = model.api.read.authentication
        ? model.api.read.authentication
        : "user";
      let authenticated = false;
      if (authentication === "user") {
        if ((req.body.auth.signInAs || "user") === "person") {
          // Validate person
          const person = await models.objects.model.findOne({
            objectId: "people",
            "data.email": sanitizeString(req.body.auth.username),
          });
          if (person) {
            if (checkPersonToken(person, req.body.auth.token)) {
              authenticated = true;
            } else {
              // Wrong password
              res.send(
                JSON.stringify({
                  success: false,
                  reason: "sign-in-failed",
                })
              );
            }
          } else {
            // No such user
            res.send(
              JSON.stringify({
                success: false,
                reason: "sign-in-failed",
              })
            );
          }
        } else {
          // Todo: validate user
          // For now just block.
          res.send(
            JSON.stringify({
              success: false,
              reason: "not-implemented",
              description: "API doesn't accept user sign in yets. Only person.",
            })
          );
        }
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
              requirements[key === "_id" ? "_id" : `data.${key}`] = value;
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

export default executeReadApi;
