import { filter, find, findIndex, map } from "lodash";

/*
 * This file keeps an internal index (in memory) of the models (usable all throughout the server) and objects (usable for search).
 * When the datastream changes the index rebuilds
 */
let modelIndex = [];
let searchableIndex = [];
let entriesIndex = [];

// Create index on server start
export const createIndex = async (models) => {
  modelIndex = await models.objects.model.find();
  entriesIndex = await models.entries.model.find();
  // Loop through models and create a relevant index
  modelIndex.map((model) => {
    updateModelObjectIndex(model);
  });
  models.objects.stream.on("change", (change) => {
    updateModelIndex(change);
  });
  models.entries.stream.on("change", (change) => {
    updateObjectIndex(change);
  });
};

// Update index when model changes (the part that relates to indexing)
const updateModelIndex = (change) => {
  if (change.operationType === "update") {
    // Update operation as performed by the UI
    // Replace old model by new model in the index
    const oldModelIndex = findIndex(modelIndex, (o) => {
      return o._id.toString() === change.documentKey._id.toString();
    });
    const oldModel = modelIndex[oldModelIndex];

    map(change.updateDescription.updatedFields, (value, key) => {
      oldModel[key] = value;
    });
    modelIndex[oldModelIndex] = oldModel;

    // If index-related fields changed, rebuild index.
    if (
      "indexed" in change.updateDescription.updatedFields ||
      "indexed_fields" in change.updateDescription.updatedFields
    ) {
      // Only change the index if a field related to index changes.
      // Remove indexed objects for this model
      searchableIndex = filter(entriesIndex, (o) => o.type !== oldModel.key);
      if (oldModel.indexed) {
        // If they require to be indexed, re-index
        console.log(`Re-indexing ${oldModel.name_plural}`);
        updateModelObjectIndex(oldModel);
      } else {
        console.log(`${oldModel.name_plural} were removed from the index.`);
      }
    }
  } else {
    // Replace operation performed otherwise.
    const newModel = change.fullDocument;

    const oldModelIndex = findIndex(modelIndex, (o) => {
      return o.key === newModel.key;
    });
    const oldModel = modelIndex[oldModelIndex];

    if (
      newModel.indexed !== oldModel.indexed ||
      newModel.indexed_fields !== oldModel.indexed_fields
    ) {
      // Only change the index if a field related to index changes.
      // Remove indexed objects for this model
      searchableIndex = filter(entriesIndex, (o) => o.type !== newModel.key);
      if (newModel.indexed) {
        // If they require to be indexed, re-index
        console.log(`Re-indexing ${newModel.name_plural}`);

        updateModelObjectIndex(newModel);
      }
    }

    modelIndex[oldModelIndex] = newModel;
  }
};

// Update indexed entry when an indexed field changes
const updateObjectIndex = (change) => {
  if (change.operationType === "update") {
    // Update operation (by UI)
    // Todo
  } else if (change.operationType === "replace") {
    // Replace operation (by database)
    const newObject = change.fullDocument;
    const oldObjectIndex = findIndex(searchableIndex, (o) => {
      return o.id === newObject._id.toString();
    });
    const model = find(modelIndex, (o) => o.key === newObject.objectId);

    const io = {
      primary: newObject.data[model.primary],
      type: model.key,
      id: newObject._id.toString(),
    };
    let keyword = `${newObject.data[model.primary]}`;
    if (model.indexed_fields) {
      model.indexed_fields.split(",").map((field, index) => {
        keyword = `${keyword} ${newObject.data[field]}`;
      });
    }
    io["keywords"] = keyword;
    searchableIndex[oldObjectIndex] = io;
  }
};

const updateModelObjectIndex = (model) => {
  if (model.indexed) {
    const modelObjects = filter(entriesIndex, (o) => o.objectId === model.key);
    modelObjects.map((mo) => {
      const io = {
        primary: mo.data[model.primary],
        type: model.key,
        id: mo._id.toString(),
      };
      let keyword = `${mo.data[model.primary]}`;
      if (model.indexed_fields) {
        model.indexed_fields.split(",").map((field, index) => {
          keyword = `${keyword} ${mo.data[field]}`;
        });
      }
      io["keywords"] = keyword;
      searchableIndex.push(io);
    });
  }
};

export const getIndex = () => {
  return { modelIndex, searchableIndex };
};
