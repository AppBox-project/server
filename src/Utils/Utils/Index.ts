import { map } from "lodash";

let index = [];
let keys = [];
let modelIndex = {};

export const createIndex = (models) => {
  // Index models:
  models.objects.model.find().then((results) => {
    results.map((model) => {
      modelIndex[model.key] = model;
    });
  });
  // Create index
  models.entries.model.find().then((results) => {
    index = results;
  });
  // Create keys
  models.objects.model.find().then((results) => {
    results.map((model) => {
      map(model.fields, (field, key) => {
        if (!keys.includes(key)) {
          // Todo: only include key if searchable = true
          keys.push(key);
        }
      });
    });
  });
};

export const getIndex = () => {
  return { index, keys: { data: keys }, modelIndex };
};
