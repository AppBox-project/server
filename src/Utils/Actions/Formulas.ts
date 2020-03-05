import f from "../Functions";

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

        args.dependencies.map(dep => {
          const currentDep = currentObj.fields[dep].dependencyFor || [];
          if (!currentDep.includes(args.fieldId)) {
            currentDep.push(args.fieldId);

            currentObj.fields[dep].dependencyFor = currentDep;
            currentObj.markModified("fields");
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
