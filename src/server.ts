import * as express from "express";
import config from "./config";
var mongoose = require("mongoose");
import actions from "./Utils/Actions";
import { map } from "lodash";
import { executeReadApi } from "./API";
var cors = require("cors");
const formidableMiddleware = require("express-formidable");
import f from "./Utils/Functions";
const fs = require("fs");
import { initServer } from "./Utils/Actions/General";
import { createIndex } from "./Utils/Utils/Index";
import { systemLog } from "./Utils/Utils/Utils";
import Axios from "axios";

// Models
require("./Utils/Models/Objects");
require("./Utils/Models/Archive");
require("./Utils/Models/Entries");
require("./Utils/Models/AppPermissions");
require("./Utils/Models/UserSettings");

// Start up server
const app = express();
app.set("port", config.port);
// Serve public files
let http = require("http").Server(app);
let io = require("socket.io")(http);

systemLog(
  `Trying to connect to the database at ${
    process.env.DBURL || "localhost:27017"
  }`
);

Axios.get(`http://${process.env.DBURL || "localhost:27017"}/AppBox`)
  .then((res) => {
    mongoose.connect(
      `mongodb://${process.env.DBURL || "localhost:27017"}/AppBox`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      }
    );
    var db = mongoose.connection;
    db.once("open", async function () {
      // Models
      const models = {
        objects: {
          model: mongoose.model("Objects"),
          stream: db.collection("objects").watch(),
          listeners: {},
        },
        archive: {
          model: mongoose.model("Archive"),
          listeners: {},
        },
        entries: {
          model: mongoose.model("Entries"),
          stream: db.collection("entries").watch(),
          listeners: {},
        },
        apppermissions: {
          model: mongoose.model("AppPermissions"),
        },
        usersettings: {
          model: mongoose.model("UserSettings"),
          stream: db.collection("usersettings").watch(),
          listeners: {},
        },
      };

      // Change streams
      models.objects.stream.on("change", (change) => {
        map(models.objects.listeners, (listener) => {
          //@ts-ignore
          listener(change);
        });
      });
      models.entries.stream.on("change", (change) => {
        map(models.entries.listeners, (listener, key) => {
          //@ts-ignore
          listener(change);
        });
      });
      models.usersettings.stream.on("change", (change) => {
        map(models.usersettings.listeners, (listener) => {
          //@ts-ignore
          listener(change);
        });
      });

      systemLog("Connected to database and loaded models.");

      const initialModels = await models.objects.model.find();
      let initialised = true;
      if (initialModels.length < 1) {
        systemLog("Database is still empty, client should show onboarding");
        initialised = false;
      }

      // Index
      createIndex(models);

      // Exclude react build resources
      // Catch all regular build files
      // Todo this can be less ugly
      // Public files
      app.use("/public", express.static("/AppBox/Files/Public"));

      // Sites
      app.use("/sites", express.static("/AppBox/Files/Sites"));

      // Static storage files
      // Todo make non-private
      app.use("/object-storage", express.static("../../Files/Objects"));

      // Api
      app.use("/api/:objectId/:apiId", cors(), (req, res, next) => {
        switch (req.params.apiId) {
          case "read":
            executeReadApi(models, req.params.objectId, req, res, next);
            break;
          default:
            res.send("Unknown API ID");
            break;
        }
      });

      app.use("/static", express.static("../Client/build/static"));
      app.use("/:filename.:extension", function (req, res) {
        var filename = req.params.filename;
        var extension = req.params.extension;
        res.sendFile(`/AppBox/System/Client/build/${filename}.${extension}`);
      });
      app.use(formidableMiddleware());

      // File uploader
      app.post("/upload", function (req, res) {
        //@ts-ignore
        const username = req.fields.username;
        //@ts-ignore
        const token = req.fields.token;
        //@ts-ignore
        const modelType = req.fields.modelType;
        //@ts-ignore
        const objectId = req.fields.objectId;

        //@ts-ignore
        const file = req.files.file;

        // Authorize user
        models.entries.model
          .findOne({ objectId: "user", "data.username": username })
          .then((user) => {
            if (user) {
              if (f.user.checkUserToken(user, token)) {
                // Succesful authentication
                // Todo: object itemtype permissions
                // Currently all authenticated users can upload
                var source = fs.createReadStream(file.path);
                fs.mkdir(
                  `/AppBox/Files/Objects/${modelType}/${objectId}`,
                  {
                    recursive: true,
                  },
                  () => {
                    var dest = fs.createWriteStream(
                      `/AppBox/Files/Objects/${modelType}/${objectId}/${file.name}`
                    );

                    source.pipe(dest);
                    source.on("end", function () {
                      res.send(
                        `/object-storage/${modelType}/${objectId}/${file.name}`
                      );
                    });
                    source.on("error", function (err) {
                      res.status(500);
                    });
                  }
                );
              } else {
                res.status(403);
                res.send("wrong-token");
              }
            } else {
              res.status(403);
              res.send("no-such-user");
            }
          });
      });

      // Serve react
      app.use("/*", express.static("../Client/build"));

      http.listen(config.port, () => {
        systemLog(`Server now available at http://localhost:${config.port}`);

        // Client interaction
        io.on("connection", (socket: any) => {
          const socketInfo = {
            listeners: [],
            permissions: ["public"],
            username: undefined,
            user: undefined,
            identified: false,
          };
          systemLog(
            `New socket connection from ${socket.request.connection.remoteAddress}`
          );

          if (!initialised) {
            socket.emit("noInit");
            socket.on("initServer", (args) => {
              initServer(args, models, socket, socketInfo);
            });
          } else {
            actions.map((action) => {
              // Perform action
              socket.on(action.key, (args) => {
                // See if we still remember who this is
                if (action.key === "signIn" || action.key === "requestToken") {
                  action.action(args, models, socket, socketInfo);
                } else if (socketInfo.identified === false) {
                  // Ask the socket to re-identify and then rebroadcast the action
                  socket.emit("who-r-u", { action, args });
                } else {
                  action.action(args, models, socket, socketInfo);
                }
              });
            });

            socket.on("disconnect", () => {
              if ((socketInfo?.listeners || []).length > 0) {
                systemLog(
                  `${socketInfo.username} closed their socket. Cleaning up ${socketInfo.listeners.length} listeners.`
                );

                socketInfo.listeners.map((listener) => {
                  delete models.objects.listeners[listener];
                  delete models.entries.listeners[listener];
                });
              }
            });
          }
        });
      });
    });
  })
  .catch((err) => {
    systemLog(`No database found. Showing set-up instructions.`);
    app.get("/", function (req, res) {
      res.send("Hello World!");
    });
  });
