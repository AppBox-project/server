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
      const response = f.formulas.parseFormula(
        args.formula,
        sampleEntry._doc.data
      );

      socket.emit(`receive-${args.requestId}`, response);
    }
  },
  {
    key: "setFormulaDependencies",
    action: async (args, models, socket, socketInfo) => {
      if (args.appId === "object-manager") {
        const currentObj = await models.objects.model.findOne({
          key: args.context
        });

        // Map dependencies
        // All fields that this forula depend on will get a tag that they are a dependency.
        // This will cause the formulafield to be updated once a dependency is updated
        args.dependencies.map(async dep => {
          if (dep.match("_r")) {
            // Relationship dep
            if (dep.match("[.]")) {
              // Remote relationship dep
              const remoteModels = { [args.context]: currentObj };
              const fieldId = `${args.context}.${args.fieldId}`;
              console.log(`Logging remote relationship ${dep} for ${fieldId}`);
              const path = dep.split(".");
              let modelName = args.context; // First model is always the context for the formula
              for (let x = 0; x < path.length; x++) {
                if (!remoteModels[modelName]) {
                  console.log(`Remotemodels containsn't ${modelName}`); // This shouldn't happen since we scan our models ahead of time
                }

                if (path[x].match("_r")) {
                  const pathPart = path[x].substr(0, path[x].length - 2);

                  // Find next model
                  const nextModelId =
                    remoteModels[modelName].fields[pathPart].typeArgs
                      .relationshipTo;
                  if (!remoteModels[nextModelId]) {
                    remoteModels[
                      nextModelId
                    ] = await models.objects.model.findOne({
                      key: nextModelId
                    });
                  }

                  // Now update the current model
                  const currentDep =
                    remoteModels[modelName].fields[pathPart].dependencyFor ||
                    [];
                  if (!currentDep.includes(fieldId)) {
                    currentDep.push(fieldId);
                  }
                  remoteModels[modelName].fields[
                    pathPart
                  ].dependencyFor = currentDep;

                  modelName = nextModelId;
                } else {
                  const currentDep =
                    remoteModels[modelName].fields[path[x]].dependencyFor || [];
                  if (!currentDep.includes(fieldId)) {
                    currentDep.push(fieldId);
                  }
                  remoteModels[modelName].fields[
                    path[x]
                  ].dependencyFor = currentDep;
                }
              }

              // Now that we've updated multiple models with their field dependencies, let's save these new models
              map(remoteModels, (newModel, key) => {
                if (key !== args.context) {
                  // Local dependencies set elsewhere
                  newModel.markModified("fields");
                  newModel.save();
                }
              });
            } else {
              // Locale relationship dep
              const newDep = dep.replace("_r", "");

              const currentDep = currentObj.fields[newDep].dependencyFor || [];
              if (!currentDep.includes(args.fieldId)) {
                currentDep.push(args.fieldId);

                currentObj.fields[newDep].dependencyFor = currentDep;
                currentObj.markModified("fields");
              }
            }
          } else {
            // Local dep
            const currentDep = currentObj.fields[dep].dependencyFor || [];
            if (!currentDep.includes(args.fieldId)) {
              currentDep.push(args.fieldId);

              currentObj.fields[dep].dependencyFor = currentDep;
              currentObj.markModified("fields");
            }
          }
        });

        currentObj.save();
      } else {
        socket.emit(`receive-${args.requestId}`, {
          success: false,
          reason: "restricted-to-core-app"
        });
      }
    }
  }
];
