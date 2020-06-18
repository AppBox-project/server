import { map } from "lodash";
import f from "../Functions";
import Functions from "../Functions";

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
  updateManyObjects: async (models, id, changes) => {
    // This is a weird version of the function I created for updateMany. Todo: merge with main updateObject
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
  // ----------> updateObject
  // This command updates an object and performs all required checks
  // - models: mongoose object
  // - socketInfo: information about executing socket
  // - args: arguments as supplied by the call
  // --- type: model type to be updated
  // --- objectId: object id
  // --- toChange: data that needs to be changed
  // --- requestId: ID as supplied by the request
  // - socket: the calling socket
  updateObject: async (
    models,
    socketInfo,
    args: { type: string; objectId: string; toChange; requestId: string },
    socket
  ) => {
    models.objects.model.findOne({ key: args.type }).then((model) => {
      if (model) {
        let hasWriteAccess = false;
        model.permissions.write.map((permission) => {
          if (socketInfo.permissions.includes(permission)) {
            hasWriteAccess = true;
          }
        });

        // Validate & save
        if (hasWriteAccess) {
          models.entries.model.findOne({ _id: args.objectId }).then((entry) => {
            // Create the new object
            const newObject = entry._doc.data;
            map(args.toChange, (v, k) => {
              newObject[k] = args.toChange[k];
            });

            f.data
              .validateData(
                model,
                { ...args, object: newObject },
                models,
                entry._doc
              )
              .then(
                async () => {
                  entry.data = f.data.transformData(
                    { data: newObject, objectId: args.type },
                    model,
                    args.toChange
                  ).data;
                  entry.markModified("data");

                  // Post process
                  entry.save().then(() => {
                    // We're done. The object was saved.
                    // Post process: Recalculate formulas
                    f.formulas.postSave(entry, args.toChange, model, models);
                    // Post process: look for relevant triggers
                    Functions.process.triggerProcessForSingleObject(
                      args.objectId,
                      model,
                      models,
                      "updated"
                    );

                    socket.emit(`receive-${args.requestId}`, {
                      success: true,
                    });
                  });
                },
                (feedback) => {
                  socket.emit(`receive-${args.requestId}`, {
                    success: false,
                    feedback,
                  });
                }
              );
          });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-write-permission",
          });
        }
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "no-such-object",
        });
      }
    });
  },
  // ----------> insertObject
  // This command inserts an object and performs all required checks
  // - models: mongoose object
  // - socketInfo: information about executing socket
  // - args: arguments as supplied by the call
  // --- type: model type to be updated
  // --- objectId: object id
  // --- object: data that needs to be changed
  // --- requestId: ID as supplied by the request
  // - socket: the calling socket
  insertObject: async (
    models,
    socketInfo,
    args: { type: string; object; requestId: string },
    socket
  ) => {
    models.objects.model.findOne({ key: args.type }).then((model) => {
      if (model) {
        let hasCreateAccess = false;
        model.permissions.create.map((permission) => {
          if (
            socketInfo.permissions.includes(permission) ||
            socketInfo.permissions.includes("system")
          ) {
            hasCreateAccess = true;
          }
        });
        if (hasCreateAccess) {
          // Validate & save
          f.data.validateData(model, args, models, false).then(
            () => {
              new models.entries.model(
                f.data.transformData(
                  { data: args.object, objectId: args.type },
                  model,
                  {}
                )
              )
                .save()
                .then((data) => {
                  // Todo: postprocess (formulas)
                  if (typeof socket === "function") {
                    socket({ success: true });
                  } else {
                    socket.emit(`receive-${args.requestId}`, {
                      success: true,
                    });
                  }
                });
            },
            (feedback) => {
              if (typeof socket === "function") {
                socket({
                  success: false,
                  feedback,
                });
              } else {
                socket.emit(`receive-${args.requestId}`, {
                  success: false,
                  feedback,
                });
              }
            }
          );
        } else {
          if (typeof socket === "function") {
            socket({
              success: false,
              reason: "no-create-permission",
            });
          } else {
            socket.emit(`receive-${args.requestId}`, {
              success: false,
              reason: "no-create-permission",
            });
          }
        }
      } else {
        if (typeof socket === "function") {
          socket({
            success: false,
            reason: "no-such-object",
          });
        } else {
          socket.emit(`receive-${args.requestId}`, {
            success: false,
            reason: "no-such-object",
          });
        }
      }
    });
  },
};
