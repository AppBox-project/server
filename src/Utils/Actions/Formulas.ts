import f from "../Functions";
import { map } from "lodash";

export default [
  // -->
  {
    key: "parseFormula",
    action: async (args, models, socket, socketInfo) => {
      const sampleEntry = await models.entries.model.findOne(
        { objectId: args.formulaContext },
        {},
        { sort: { created_at: -1 } }
      );
      const response = f.formulas.parseFormulaSample(
        args.formula,
        sampleEntry._doc.data
      );

      socket.emit(`receive-${args.requestId}`, response);
    },
  },
  {
    key: "setFormulaDependencies",
    action: async (args, models, socket, socketInfo) => {
      // This action is for saving of a formula. It marks dependencies in the database.
      if (args.appId === "object-manager") {
        args.dependencies.map(async (dependency) => {
          // Per dependency part: create a map
          if (dependency.match("\\.")) {
            f.formulas
              .dependencyToMap(dependency, models, args.context)
              .then((modelList) => {
                //@ts-ignore
                modelList.map(async (dep) => {
                  const formula = await models.objects.model.findOne({
                    key: dep.markAsDependency.key,
                  });
                  if (formula.fields[dep.markAsDependency.path].dependencyFor) {
                    if (
                      !formula.fields[
                        dep.markAsDependency.path
                      ].dependencyFor.includes(
                        `${args.context}.${args.fieldId}`
                      )
                    ) {
                      formula.fields[
                        dep.markAsDependency.path
                      ].dependencyFor.push(`${args.context}.${args.fieldId}`);
                    }
                  } else {
                    formula.fields[dep.markAsDependency.path].dependencyFor = [
                      `${args.context}.${args.fieldId}`,
                    ];
                  }
                  formula.markModified("fields");
                  formula.save();
                });
              });
          } else {
            const formula = await models.objects.model.findOne({
              key: args.context,
            });

            if (formula.fields[dependency].dependencyFor) {
              if (
                !formula.fields[dependency].dependencyFor.includes(args.fieldId)
              ) {
                formula.fields[dependency].dependencyFor.push(args.fieldId);
              }
            } else {
              formula.fields[dependency].dependencyFor = [args.fieldId];
            }
            formula.markModified("fields");
            formula.save();
          }
        });
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "restricted-to-core-app",
        });
      }
    },
  },
  {
    key: "testFormula",
    action: async (args, models, socket, socketInfo) => {
      // Because this is a test, fetch a sample ID
      const sampleEntry = await models.entries.model.findOne(
        { objectId: args.context },
        {},
        { sort: { created_at: -1 } }
      );

      // Process formula and respond
      socket.emit(
        `receive-${args.requestId}`,
        await f.formulas.calculateFormulaFromId(
          args.formula,
          sampleEntry._id,
          args.dependencies,
          models
        )
      );
    },
  },
];
