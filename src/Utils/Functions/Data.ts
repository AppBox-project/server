import { map } from "lodash";
import f from "../Functions";

// This is the rewritten version of validate data
const validateNewObject = async (models, newObject, oldObject) => {
  const errors = [];
  const model = await models.objects.model.findOne({
    key: oldObject.objectId,
  });

  const fieldPromises = [];
  map(model.fields, async (field, fieldId) => {
    fieldPromises.push(
      new Promise((fieldPromiseResolve, fieldPromiseReject) => {
        // Step 1: required fields
        if (field.required) {
          // Check if the object has a value
          if (!newObject.data[fieldId]) {
            errors.push({ reason: "missing-required", field: fieldId });
          }
        }

        // Step 2: unique fields
        const uniquePromise = new Promise(
          async (uniquePromiseResolve, uniquePromiseReject) => {
            if (field.unique) {
              const sk = `data.${fieldId}`;

              const duplicate = await models.entries.model.findOne({
                objectId: model.key,
                [sk]: newObject.data[fieldId],
              });
              if (duplicate._id.equals(oldObject._id)) {
                uniquePromiseResolve();
              } else {
                errors.push({ reason: "not-unique", field: fieldId });
                uniquePromiseResolve();
              }
            } else {
              uniquePromiseResolve();
            }
          }
        );

        // Todo Check 3 (validations)

        Promise.all([uniquePromise]).then(() => {
          fieldPromiseResolve();
        });
      })
    );
  });

  await Promise.all(fieldPromises);
  return errors;
};

const transformData = (data, model, changed) => {
  map(model.fields, (field, k) => {
    if (k in changed) {
      if (field.transformations) {
        field.transformations.map((transformation) => {
          switch (transformation) {
            case "toLowerCase":
              data.data[k] = data.data[k].toLowerCase();
              break;
            case "toUpperCase":
              data.data[k] = data.data[k].toUpperCase();
              break;
            case "hash":
              data.data[k] = f.user.hashString(data.data[k]);
              break;
            default:
              console.log(
                `Unknown transformation ${transformation} not applied.`
              );

              break;
          }
        });
      }
    }
  });

  return data;
};

export default {
  // validateData()
  // --> Loop through the fields for a model and validate piece by piece
  validateData: (data, args, models, oldObject) => {
    return new Promise((resolve, reject) => {
      const errors = [];
      const fieldChecks = [];

      map(data.fields, (field, k) => {
        fieldChecks.push(
          new Promise((resolve, reject) => {
            const parts = [
              new Promise((subresolve, reject) => {
                // Check 1
                if (field.required) {
                  if (!args.object[k]) {
                    errors.push({ reason: "missing-required", field: k });
                  }
                }
                subresolve();
              }),
              new Promise((subresolve, reject) => {
                // Check 2
                if (field.unique) {
                  const sk = "data." + k;
                  models.entries.model
                    .findOne({
                      objectId: args.type,
                      [sk]: args.object[k],
                    })
                    .then((existingObj) => {
                      if (existingObj) {
                        if (!oldObject) {
                          errors.push({ reason: "not-unique", field: k });
                        } else {
                          if (existingObj.data[k] !== oldObject.data[k]) {
                            errors.push({ reason: "not-unique", field: k });
                          }
                        }
                      }

                      subresolve();
                    });
                } else {
                  subresolve();
                }
              }),
              new Promise((subresolve, reject) => {
                // Check 3
                if (field.validations) {
                  if (args.object[k]) {
                    field.validations.map((validation) => {
                      let rule = validation;
                      let ruleArgs = "";
                      if (validation.includes("(")) {
                        rule = validation.split("(")[0];
                        ruleArgs = validation.split("(")[1].split(")")[0];
                        if (ruleArgs.includes(",")) {
                          //@ts-ignore
                          ruleArgs = ruleArgs.split(",");
                        }
                      }

                      switch (rule) {
                        case "isEmail":
                          var re = /\S+@\S+\.\S+/;
                          if (!re.test(args.object[k])) {
                            errors.push({
                              reason: "no-email",
                              field: k,
                            });
                          }

                          break;

                        case "hasMinLength":
                          if (args.object[k].length < ruleArgs) {
                            errors.push({
                              reason: "too-short",
                              minLength: ruleArgs,
                              field: k,
                            });
                          }
                          break;
                        default:
                          console.log(
                            `Error! Unknown validation ${validation}.`
                          );

                          break;
                      }
                    });
                  }
                }
                subresolve();
              }),
            ];

            Promise.all(parts).then(() => {
              resolve();
            });
          })
        );
      });

      Promise.all(fieldChecks).then(() => {
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve();
        }
      });
    });
  },
  // transformData()
  // --> Loop through the fields for a model and apply required transformations
  transformData,
  updateObject: async (models, id, changes) => {
    // Todo: this may require a permissions check (see older functions)
    return new Promise(async (resolve, reject) => {
      const oldObject = await models.entries.model.findOne({ _id: id });
      let newObject = oldObject;
      map(changes, (value, fieldId) => {
        newObject.data[fieldId] = value;
      });

      const validations = await validateNewObject(models, newObject, oldObject);
      if (validations.length < 1) {
        // Passed
        // Step 2: Transform data
        const model = await models.objects.model.findOne({
          key: oldObject.objectId,
        });

        newObject = transformData(newObject, model, changes);
        newObject.markModified("data");
        newObject.save();
        resolve();
      } else {
        // Failed
        reject(validations);
      }
    });
  },
};
