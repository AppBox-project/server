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
    }
  },
  {
    key: "setFormulaDependencies",
    action: async (args, models, socket, socketInfo) => {
      // This action is for saving of a formula. It marks dependencies in the database.
      if (args.appId === "object-manager") {
        args.dependencies.map(async dependency => {
          // Per dependency part: create a map
          dependency
            .split(".")
            .reduce(async (previousPromise, pathPart) => {
              let newData = await previousPromise;
              if (newData.length < 1) {
                // The first object starts from context
                const subObject = await models.objects.model.findOne({
                  key: args.context
                });

                newData.push({
                  markAsDependency: {
                    path: pathPart.replace(new RegExp("\\_r$"), ""),
                    key: args.context
                  },
                  nextObject:
                    subObject.fields[pathPart.replace(new RegExp("\\_r$"), "")]
                      .typeArgs.relationshipTo
                });
              } else {
                // Every next one from the result type of the previous one.
                const subObject = await models.objects.model.findOne({
                  key: newData[newData.length - 1].nextObject
                });

                newData.push({
                  markAsDependency: {
                    path: pathPart.replace(new RegExp("\\_r$"), ""),
                    key: newData[newData.length - 1].nextObject
                  },
                  nextObject: pathPart.match("_r")
                    ? subObject.fields[
                        pathPart.replace(new RegExp("\\_r$"), "")
                      ].typeArgs.relationshipTo
                    : null
                });
              }

              return newData;
            }, Promise.resolve([]))
            .then(modelList => {
              modelList.map(async dep => {
                const formula = await models.objects.model.findOne({
                  key: dep.markAsDependency.key
                });
                if (formula.fields[dep.markAsDependency.path].dependencyFor) {
                  if (
                    !formula.fields[
                      dep.markAsDependency.path
                    ].dependencyFor.includes(`${args.context}.${args.fieldId}`)
                  ) {
                    formula.fields[
                      dep.markAsDependency.path
                    ].dependencyFor.push(`${args.context}.${args.fieldId}`);
                  }
                } else {
                  formula.fields[dep.markAsDependency.path].dependencyFor = [
                    `${args.context}.${args.fieldId}`
                  ];
                }
                formula.markModified("fields");
                formula.save();
              });
            });
        });
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "restricted-to-core-app"
        });
      }
    }
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
          args.context,
          models
        )
      );
    }
  }
];
