require("../Models/AppPermissions");
require("../Models/AppSettings");
require("../Models/Archive");
require("../Models/Attachments");
require("../Models/Models");
require("../Models/Objects");
require("../Models/SystemSettings");
require("../Models/UserSettings");
var mongoose = require("mongoose");

export default class DatabaseModel {
  models: { model; stream; listeners: {} };
  objects: { model; stream; listeners: {} };
  attachments: { model; stream; listeners: {} };
  archive: { model; listeners: {} };
  apppermissions;
  appsettings;
  systemsettings;
  usersettings: { model; stream; listeners: {} };
  db;

  constructor(db) {
    this.db = db;
    this.models = {
      model: mongoose.model("Models"),
      stream: db.collection("models").watch(),
      listeners: {},
    };
    this.archive = {
      model: mongoose.model("Archive"),
      listeners: {},
    };
    this.attachments = {
      model: mongoose.model("Attachments"),
      stream: db.collection("attachments").watch(),
      listeners: {},
    };
    this.objects = {
      model: mongoose.model("Objects"),
      stream: db.collection("objects").watch(),
      listeners: {},
    };
    this.apppermissions = mongoose.model("AppPermissions");

    this.usersettings = {
      model: mongoose.model("UserSettings"),
      stream: db.collection("usersettings").watch(),
      listeners: {},
    };
    this.appsettings = mongoose.model("AppSettings");
    this.systemsettings = mongoose.model("SystemSettings");
  }
}
