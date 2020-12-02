import { map, uniqueId } from "lodash";
import f from "../Functions";
import { AppModelType } from "appbox-types";
import { ModelRuleType } from "../Utils/Types";
import Formula from "appbox-formulas";
const uniqid = require("uniqid");

// This is the rewritten version of validate data
const validateNewObject = async (models, newObject, oldObject) => {
  const errors = [];
  const model = await models.models.model.findOne({
    key: oldObject.objectId,
  });

  const fieldPromises = [];
  map(model.fields, async (field, fieldId) => {
    fieldPromises.push(
      new Promise<void>((fieldPromiseResolve, fieldPromiseReject) => {
        // Step 1: required fields
        if (field.required) {
          // Check if the object has a value
          if (!newObject.data[fieldId]) {
            errors.push({ reason: "missing-required", field: fieldId });
          }
        }

        // Step 2: unique fields
        const uniquePromise = new Promise<void>(
          async (uniquePromiseResolve, uniquePromiseReject) => {
            if (field.unique) {
              const sk = `data.${fieldId}`;

              const duplicate = await models.objects.model.findOne({
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
  validateData: (data, object, type, models, oldObject) => {
    return new Promise<void>((resolve, reject) => {
      const errors = [];
      const fieldChecks = [];

      map(data.fields, (field, k) => {
        fieldChecks.push(
          new Promise<void>((resolve, reject) => {
            const parts = [
              new Promise<void>((subresolve, reject) => {
                // Check 1
                if (field.required) {
                  if (!object[k]) {
                    errors.push({ reason: "missing-required", field: k });
                  }
                }
                subresolve();
              }),
              new Promise<void>((subresolve, reject) => {
                // Check 2
                if (field.unique) {
                  const sk = "data." + k;
                  models.objects.model
                    .findOne({
                      objectId: type,
                      [sk]: object[k],
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
              new Promise<void>((subresolve, reject) => {
                // Check 3
                if (field.validations) {
                  if (object[k]) {
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
                          if (!re.test(object[k])) {
                            errors.push({
                              reason: "no-email",
                              field: k,
                            });
                          }

                          break;

                        case "hasMinLength":
                          if (object[k].length < ruleArgs) {
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
    return new Promise<void>(async (resolve, reject) => {
      const oldObject = await models.objects.model.findOne({ _id: id });
      let newObject = oldObject;
      map(changes, (value, fieldId) => {
        newObject.data[fieldId] = value;
        newObject.markModified(`data.${fieldId}`);
      });

      const validations = await validateNewObject(models, newObject, oldObject);
      if (validations.length < 1) {
        // Passed
        // Step 2: Transform data
        const model = await models.models.model.findOne({
          key: oldObject.objectId,
        });

        newObject = transformData(newObject, model, changes);
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
    models.models.model
      .findOne({ key: args.type })
      .then((model: AppModelType) => {
        if (model) {
          let hasWriteAccess = false;
          model.permissions.write.map((permission) => {
            if (socketInfo.permissions.includes(permission)) {
              hasWriteAccess = true;
            }
          });

          // Validate & save
          if (hasWriteAccess) {
            models.objects.model
              .findOne({ _id: args.objectId })
              .then((entry) => {
                // Create the new object
                const newObject = entry._doc.data;
                map(args.toChange, (v, k) => {
                  newObject[k] = args.toChange[k];
                  entry.markModified(`data.${k}`);
                });

                f.data
                  .validateData(model, newObject, args.type, models, entry._doc)
                  .then(
                    async () => {
                      entry.data = f.data.transformData(
                        { data: newObject, objectId: args.type },
                        model,
                        args.toChange
                      ).data;

                      // Check if the model has any rules
                      let passedRules = true;
                      let feedback = [];
                      if (model.rules) {
                        await Object.keys(model.rules).reduce(
                          //@ts-ignore
                          async (prev, curr) => {
                            await prev;
                            const rule: ModelRuleType = model.rules[curr];
                            if (
                              rule.checkedOn === "All" ||
                              rule.checkedOn === "InsertAndUpdate" ||
                              rule.checkedOn === "UpdateAndDelete"
                            ) {
                              const formula = new Formula(
                                `{{${rule.rule}}}`,
                                model,
                                models,
                                uniqid()
                              );
                              await formula.compile();
                              const result = await formula.calculate(
                                entry.data,
                                { models, object: entry }
                              );

                              // If result compiles to true we return a message
                              if (result === "true") {
                                passedRules = false;
                                feedback.push({ reason: rule.message });
                              }
                            }

                            return curr;
                          },
                          Object.keys(model.rules)[0]
                        );
                      }

                      // Post process
                      if (passedRules) {
                        entry.save().then(() => {
                          // We're done. The object was saved.
                          socket.emit(`receive-${args.requestId}`, {
                            success: true,
                          });
                        });
                      } else {
                        socket.emit(`receive-${args.requestId}`, {
                          success: false,
                          feedback,
                        });
                      }
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
    socket,
    serverInitialisedAction = false
  ) =>
    new Promise((resolve, reject) => {
      models.models.model.findOne({ key: args.type }).then(async (model) => {
        if (model) {
          let hasCreateAccess = false;
          if (serverInitialisedAction) {
            hasCreateAccess = true;
          } else {
            model.permissions.create.map((permission) => {
              if (
                socketInfo.permissions.includes(permission) ||
                socketInfo.permissions.includes("system")
              ) {
                hasCreateAccess = true;
              }
            });
          }
          if (hasCreateAccess) {
            // Todo: objectcount is only used when a auto_name field is present.
            const objectCount: number =
              (await models.objects.model.countDocuments({
                objectId: args.type,
              })) + 1;

            // Add any default values to the new object's model
            //@ts-ignore
            await Object.keys(model.fields).reduce(async (prev, mKey) => {
              await prev;
              const mField = model.fields[mKey];

              if (mField.default && !args.object[mKey]) {
                let defaultValue = mField.default;
                if (defaultValue.match("{{")) {
                  const defaultFormula = new Formula(
                    mField.default,
                    model,
                    models,
                    uniqid()
                  );
                  await defaultFormula.compile();
                  const object = {
                    __currentUserId: socketInfo.user._id,
                    __currentUser: socketInfo.user.data,
                  };
                  defaultValue = await defaultFormula.calculate(object, {
                    models,
                    object: { data: object },
                  });
                }

                args.object[mKey] = defaultValue;
              }
              if (mField.type === "auto_name") {
                args.object[mKey] = `${mField.typeArgs.prefix}-`;
                if (mField.typeArgs.mode === "random") {
                  args.object[mKey] += uniqid();
                } else {
                  args.object[mKey] +=
                    (await models.objects.model.count({
                      objectId: args.type,
                    })) + 1;
                }
              }
              return mKey;
            }, Object.keys(model.fields)[0]);

            // Validate & save
            f.data
              .validateData(model, args.object, args.type, models, false)
              .then(
                async () => {
                  const newObject = new models.objects.model(
                    f.data.transformData(
                      {
                        data: args.object,
                        objectId: args.type,
                      },
                      model,
                      {}
                    )
                  );

                  // Log inserting
                  // Check if the model has any rules
                  let passedRules = true;
                  let feedback = [];
                  if (model.rules) {
                    await Object.keys(model.rules).reduce(
                      //@ts-ignore
                      async (prev, curr) => {
                        await prev;
                        const rule: ModelRuleType = model.rules[curr];
                        if (
                          rule.checkedOn === "All" ||
                          rule.checkedOn === "InsertAndUpdate" ||
                          rule.checkedOn === "InsertAndDelete"
                        ) {
                          const formula = new Formula(
                            `{{${rule.rule}}}`,
                            model,
                            models,
                            uniqid()
                          );
                          await formula.compile();
                          const result = await formula.calculate(
                            newObject.data,
                            {
                              models,
                              object: newObject,
                            }
                          );

                          // If result compiles to true we return a message and block insertion.
                          if (result === "true") {
                            passedRules = false;
                            feedback.push({ reason: rule.message });
                          }
                        }

                        return curr;
                      },
                      Object.keys(model.rules)[0]
                    );
                  }
                  if (passedRules) {
                    newObject.save().then((data) => {
                      // We're done. The object was saved.
                      resolve(data._id.toString());
                      if (typeof socket === "function") {
                        socket({ success: true });
                      } else {
                        socket.emit(`receive-${args.requestId}`, {
                          success: true,
                        });
                      }
                    });
                  } else {
                    socket.emit(`receive-${args.requestId}`, {
                      success: false,
                      feedback,
                    });
                  }
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
          reject("no-such-object");
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
    }),
};
