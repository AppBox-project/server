import nunjucks from "../Utils/nunjucks";
import { map, reverse, set, get } from "lodash";

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

    dependencies.map(async dependency => {
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

export default {
  calculateFormulaFromId,
  parseFormulaSample: (formula, data) => {
    return nunjucks.renderString(formula, data);
  },
  postProcessCaculcateFormulas: async (entry, changed, model, models) => {
    const dependencies = [];
    // List dependencies for changed fields
    map(changed, (change, key) => {
      if (model.fields[key].dependencyFor) {
        model.fields[key].dependencyFor.map(depFor => {
          if (!dependencies.includes(depFor)) {
            dependencies.push(depFor);
          }
        });
      }
    });

    // Loop through each dependent formula and re-calculate
    // Todo figure out relationships
    dependencies.map(async dependency => {
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

        objects.map(object => {
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
    return new Promise(async (resolve, reject) => {
      const model = await models.objects.model.findOne({ key: context });
      let object = await models.entries.model.findOne({ _id: objectId });
      object = object.data;

      // Step 1: extend model with relationship data
      dependencies.map(async dependency => {
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
                  _id
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
        model.fields[field].dependencyFor.map(async depFor => {
          console.log(depFor);

          if (depFor.match("\\.")) {
            // Option 1: remote dependency
            // This could theoretically affect thousands of records, therefore:
            // figure out the impact and create a task for the seperate service to handle
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
  }
};

// Internal functions
const parseFormula = (formula, data) => {
  return nunjucks.renderString(formula, data);
};
