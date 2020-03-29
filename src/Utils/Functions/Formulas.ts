import nunjucks from "../Utils/nunjucks";
import { map, reverse } from "lodash";

// Todo nunjucks issues a warning about code injection
// Not too worried about that since only the admin can create formula fields

export default {
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
  }
};

// Internal functions
const parseFormula = (formula, data) => {
  return nunjucks.renderString(formula, data);
};
