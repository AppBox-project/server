import nunjucks from "../Utils/nunjucks";
import { map, set, get, findIndex } from "lodash";

// Todo nunjucks issues a warning about code injection
// Not too worried about that since only the admin can create formula fields

const calculateFormulaFromId = async (
  formula,
  contextId,
  dependencies,
  models
) => {
  // Step 1: fetch basemodel
  return new Promise(async (resolve, reject) => {
    let data = await models.entries.model.findOne({ _id: contextId });
    data = data.data;

    dependencies.map(async (dependency) => {
      if (dependency.match("\\.")) {
        // Levelled dependency
        let path = "";
        data = await dependency
          .split(".")
          .reduce(async (previousPromise, pathPart) => {
            let newData = await previousPromise;
            if (newData.length < 1) newData = data; // Only on first run

            // Find path
            path = path + pathPart;
            if (path.match("_r")) path += ".";
            const subPath = path.replace(new RegExp("\\.$"), "");
            const idPath = subPath.replace(new RegExp("\\_r$"), "");

            // Follow the relationships and add the data
            if (pathPart.match("_r")) {
              const _id = get(data, idPath);
              const subData = await models.entries.model.findOne({ _id });
              newData = set(newData, subPath, subData.data);
            }

            return newData;
          }, Promise.resolve([]));

        // Done
        // Todo -> this currently happens once per dependency. Lift out to promise reduction
        resolve(nunjucks.renderString(formula, data));
      } else {
        resolve(nunjucks.renderString(formula, data));
      }
    });
  });
};

const dependencyToMap = async (dependency, models, context) => {
  return new Promise(async (resolve, reject) => {
    resolve(
      await dependency.split(".").reduce(async (previousPromise, pathPart) => {
        let newData = await previousPromise;
        if (newData.length < 1) {
          // The first object starts from context
          const subObject = await models.objects.model.findOne({
            key: context,
          });

          newData.push({
            markAsDependency: {
              path: pathPart.replace(new RegExp("\\_r$"), ""),
              key: context,
            },
            nextObject:
              subObject.fields[pathPart.replace(new RegExp("\\_r$"), "")]
                .typeArgs.relationshipTo,
          });
        } else {
          // Every next one from the result type of the previous one.
          const subObject = await models.objects.model.findOne({
            key: newData[newData.length - 1].nextObject,
          });

          newData.push({
            markAsDependency: {
              path: pathPart.replace(new RegExp("\\_r$"), ""),
              key: newData[newData.length - 1].nextObject,
            },
            nextObject: pathPart.match("_r")
              ? subObject.fields[pathPart.replace(new RegExp("\\_r$"), "")]
                  .typeArgs.relationshipTo
              : null,
          });
        }

        return newData;
      }, Promise.resolve([]))
    );
  });
};

export default {
  calculateFormulaFromId,
  parseFormulaSample: (formula, data) => {
    // Retired code
    return nunjucks.renderString(formula, data);
  },
  postProcessCaculcateFormulas: async (entry, changed, model, models) => {
    // Retired code
    const dependencies = [];
    // List dependencies for changed fields
    map(changed, (change, key) => {
      if (model.fields[key].dependencyFor) {
        model.fields[key].dependencyFor.map((depFor) => {
          if (!dependencies.includes(depFor)) {
            dependencies.push(depFor);
          }
        });
      }
    });

    // Loop through each dependent formula and re-calculate
    // Todo figure out relationships
    dependencies.map(async (dependency) => {
      if (dependency.match("[.]")) {
        // Remote dependency
        const modelId = dependency.split(".")[0];
        const fieldId = dependency.split(".")[1];
        console.log(
          `Remote dependency triggered. Recalculating all ${dependency} fields that depend on this object.`
        );
        // Step 1: loop through all potential tags
        const model = await models.objects.model.findOne({ key: modelId });
        const objects = await models.entries.model.find({ objectId: modelId });
        const formula = model.fields[fieldId].typeArgs.formula;

        objects.map((object) => {
          console.log(object._id);
        });
      } else {
        // Local dependency
        entry._doc.data[dependency] = nunjucks.renderString(
          model.fields[dependency].typeArgs.formula,
          entry._doc.data
        );
      }
    });
    return entry;
  },
  parseFormula: async (models, context, objectId, formula, dependencies) => {
    // Retired code
    return new Promise(async (resolve, reject) => {
      const model = await models.objects.model.findOne({ key: context });
      let object = await models.entries.model.findOne({ _id: objectId });
      object = object.data;

      // Step 1: extend model with relationship data
      dependencies.map(async (dependency) => {
        if (dependency.match("_r")) {
          const parts = dependency.split(".");
          let previousResult = {};
          for (let x = 0; x < parts.length; x++) {
            // Find part (fieldname minus _r)
            let part = parts[x];
            if (part.match("_r")) {
              part = part.substr(0, part.length - 2);

              let _id = object[part];

              if (!_id) {
                let subObject = object;
                for (let y = 0; y < x; y++) {
                  const partId = parts[y + 1].substr(
                    0,
                    parts[y + 1].length - 2
                  );

                  subObject = subObject[parts[y]];
                  if (x == y + 1) {
                    _id = subObject[partId];
                  }
                }
              }

              // Retrieve more data
              const data =
                (await models.entries.model.findOne({
                  _id,
                })) || {};

              // Save to the object
              let subData = data.data;
              for (let z = x; z > -1; z--) {
                const localPreviousResult = previousResult;
                previousResult = subData;
                subData = { ...localPreviousResult, [parts[z]]: subData };
              }

              object = { ...object, ...subData };
            }
          }
          resolve(parseFormula(formula, object));
        }
      });
    });
  },
  postSave: (entry, changes, model, models) => {
    // Step 1: see if any dependencies need updating
    map(changes, (change, field) => {
      if (model.fields[field].dependencyFor) {
        // One of the fields that changed is a dependency field
        model.fields[field].dependencyFor.map(async (depFor) => {
          if (depFor.match("\\.")) {
            // Option 1: remote dependency
            // This could theoretically affect thousands of records, therefore:
            // figure out the impact and create a task for the seperate service to handle
            const rModelId = depFor.split(".")[0];
            const rFieldId = depFor.split(".")[1];

            // Get remote model
            const rModel = await models.objects.model.findOne({
              key: rModelId,
            });
            const rField = rModel.fields[rFieldId];

            // Basic new task
            const newTask = {
              type: "Formula recalculation",
              name: `Recalculate formula ${rModelId}.${rFieldId}`,
              description: `Triggered by a change to ${entry._id}`,
              when: "asap",
              action: "formula-calculate",
              done: false,
              arguments: undefined,
            };

            // Step 1: Create a mapping array (models)
            rField.typeArgs.dependencies.map(async (dep) => {
              const map = await dependencyToMap(dep, models, rModelId);

              // Step 2: find impacted formulas
              const arrayToReduce = [];
              for (
                // Find where we currently are in the formula and work back to the beginning of the formula
                let x =
                  //@ts-ignore
                  findIndex(map, (o) => {
                    return (
                      //@ts-ignore
                      o.markAsDependency.path === field &&
                      //@ts-ignore
                      o.markAsDependency.key === model.key
                    );
                  }) - 1;
                x >= 0;
                x--
              ) {
                arrayToReduce.push(map[x]);
              }

              // Execute reduce (traverse the formula back to the beginning)
              const impactedFormulas = [];

              await arrayToReduce.reduce(
                async (previousPromise, currentObject) => {
                  const currentIds = await previousPromise;

                  // Prepare
                  if (currentIds.length < 1)
                    currentIds.push(entry._id.toString());

                  // Find results
                  // Todo: can't use find() without a model, further optimize to directly filter

                  const results = await models.entries.model.find({
                    objectId: currentObject.markAsDependency.key,
                  });

                  results.map((result) => {
                    if (
                      currentIds.includes(
                        get(
                          result,
                          `data.${currentObject.markAsDependency.path}`
                        )
                      )
                    ) {
                      if (
                        currentObject ===
                        arrayToReduce[arrayToReduce.length - 1]
                      ) {
                        impactedFormulas.push(result._id.toString());
                      } else {
                        currentIds.push(result._id.toString()); // Add to acceptable ID's for next step
                      }
                    }
                  });

                  return currentIds;
                },
                Promise.resolve([])
              );

              // Done, we have a list of impacted dependencies
              // Create a new task.
              newTask.arguments = {
                objects: impactedFormulas,
                field: rFieldId,
                model: rModelId,
              };
              console.log(
                await models.entries.model.create({
                  objectId: "system-task",
                  data: newTask,
                })
              );
            });
          } else {
            // Option 2: local dependency
            // Calculate directly because of low impact
            entry.data[depFor] = await calculateFormulaFromId(
              model.fields[depFor].typeArgs.formula,
              entry._id,
              model.fields[depFor].typeArgs.dependencies,
              models
            );

            entry.markModified("data");
            entry.save();
          }
        });
      }
    });
  },
  dependencyToMap,
};

// Internal functions
const parseFormula = (formula, data) => {
  return nunjucks.renderString(formula, data);
};
