import nunjucks from "../Utils/nunjucks";
import { map } from "lodash";

// Todo nunjucks issues a warning about code injection
// Not too worried about that since only the admin can create formula fields

export default {
  parseFormula: (formula, data) => {
    return nunjucks.renderString(formula, data);
  },
  postProcessCaculcateFormulas: async (entry, changed, model) => {
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
    dependencies.map(dependency => {
      entry._doc.data[dependency] = nunjucks.renderString(
        model.fields[dependency].typeArgs.formula,
        entry._doc.data
      );
    });
    return entry;
  }
};
