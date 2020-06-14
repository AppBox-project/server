import { ModelType } from "../Utils/Types";

export default {
  // ----------> triggerProcessForSingleObject
  // This function checks if a trigger exists for when a certain object is updated or created.
  // - objectId: the object ID that was just updated.
  // - objectModel: the model for the object that was just updated.
  triggerProcessForSingleObject: async (
    objectId: string,
    objectModel: ModelType
  ) => {
    console.log(`Looking for triggers for ${objectId} (a ${objectModel.name})`);
  },
};
