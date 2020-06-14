import { ModelType, AppBoxData } from "../Utils/Types";

export default {
  // ----------> triggerProcessForSingleObject
  // This function checks if a trigger exists for when a certain object is updated or created.
  // - objectId: the object ID that was just updated.
  // - objectModel: the model for the object that was just updated.
  // - models: AppBoxData
  // - action: "created" or "updated"
  triggerProcessForSingleObject: async (
    objectId: string,
    objectModel: ModelType,
    models: AppBoxData,
    action: string
  ) => {
    // Fetch processes with this object as context
    const processes = await models.entries.model.find({
      objectId: "system-processes",
      "data.context": objectModel.key,
    });

    // Check if the action (created or updated)
    processes.map((process) => {
      // All found processes
      process.data.triggers.map((trigger) => {
        // All relevant triggers
        if (trigger.type === action) {
          // See if trigger type matches what just happened (created or updated)
          // Trigger passed, execute action
          executeProcess(objectId, objectModel, process, models);
        }
      });
    });
  },
};

// ----------> executeProcess
// This function performs
// - objectId: the object ID that was just updated.
// - objectModel: the model for the object that was just updated.
// - models: AppBoxData
// - action: "created" or "updated"

const executeProcess = async (
  objectId: string,
  objectModel: ModelType,
  process,
  models: AppBoxData
) => {
  console.log(
    `Process: ${objectModel.name} ${objectId} has triggered process '${process.data.name}'.`
  );
  const object = await models.entries.model.findOne({ _id: objectId });
  process.data.actions.map((action) => {
    executeProcessAction(action, object, models, objectId);
  });
};

const executeProcessAction = (
  action,
  object,
  models: AppBoxData,
  objectId: string
) => {
  console.log(`Process: Checking ${action.condition.name}.`);
  let conditionsMatched = true;
  action.condition.conditions.map((condition) => {
    if (condition.type === "field") {
      if (condition.operator === "is") {
        if (object.data[condition.field] !== condition.value) {
          conditionsMatched = false;
        }
      }
    }
  });

  // We've checked the conditions.
  let nextAction;
  if (conditionsMatched) {
    console.log("Process: condition met");
    nextAction = action.condition.effects.true;
  } else {
    console.log("Process: condition not met");
    nextAction = action.condition.effects.false;
  }

  switch (nextAction) {
    case "actions":
      performActions(action.actions, models, objectId);
      break;
    default:
      console.log(`unknown next action ${nextAction}`);
      break;
  }
};

const performActions = (
  actions: [{ label?: string; actions: [{ action: string }] }],
  models: AppBoxData,
  objectId: string
) => {
  console.log(
    `Process: performing ${actions.length} action${
      actions.length != 1 ? "s" : ""
    }.`
  );
  actions.map((action, index) => {
    console.log(`Process: Action ${index + 1}: executing '${action.label}'.`);
    action.actions.map((subAction) => {
      switch (subAction.action) {
        case "delete":
          models.entries.model.deleteOne({ _id: objectId }).then((result) => {
            console.log(result);
          });
          break;
        default:
          console.log(`Process: Unknown action ${subAction.action}`);
          break;
      }
    });
  });
};

// Todo executeProcessMultiple()
