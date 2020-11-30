import * as express from "express";
import config from "./config";
var mongoose = require("mongoose");
import actions from "./Utils/Actions";
import { map } from "lodash";
var cors = require("cors");
const formidableMiddleware = require("express-formidable");
import f from "./Utils/Functions";
const fs = require("fs");
import { initServer } from "./Utils/Actions/General";
import { createIndex } from "./Utils/Utils/Index";
import { systemLog } from "./Utils/Utils/Utils";
import Axios from "axios";
import executeReadApi from "./API/read";
import executeStandaloneApi from "./API/standalone";
import executeSignInApi from "./API/signIn";
const bodyParser = require("body-parser");

// Models
require("./Utils/Models/Models");
require("./Utils/Models/Archive");
require("./Utils/Models/Objects");
require("./Utils/Models/AppPermissions");
require("./Utils/Models/Attachments");
require("./Utils/Models/UserSettings");
require("./Utils/Models/AppSettings");

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

// Redirect trailing slashes.
app.use((req, res, next) => {
  const test = /\?[^]*\//.test(req.url);
  if (req.url.substr(-1) === "/" && req.url.length > 1 && !test)
    res.redirect(301, req.url.slice(0, -1));
  else next();
});

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
        models: {
          model: mongoose.model("Models"),
          stream: db.collection("models").watch(),
          listeners: {},
        },
        archive: {
          model: mongoose.model("Archive"),
          listeners: {},
        },
        attachments: {
          model: mongoose.model("Attachments"),
          stream: db.collection("attachments").watch(),
          listeners: {},
        },
        objects: {
          model: mongoose.model("Objects"),
          stream: db.collection("objects").watch(),
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
        appsettings: { model: mongoose.model("AppSettings") },
      };

      // Change streams
      models.models.stream.on("change", (change) => {
        map(models.models.listeners, (listener) => {
          //@ts-ignore
          listener(change);
        });
      });
      models.objects.stream.on("change", (change) => {
        map(models.objects.listeners, (listener, key) => {
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
      models.attachments.stream.on("change", (change) => {
        map(models.attachments.listeners, (listener) => {
          //@ts-ignore
          listener(change);
        });
      });

      systemLog("Connected to database and loaded models.");

      const initialModels = await models.models.model.find();
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
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());
      app.use(bodyParser.raw());
      app.use("/api/:objectId/:apiId/:optional?", cors(), (req, res, next) => {
        switch (req.params.apiId) {
          case "read":
            executeReadApi(models, req.params.objectId, req, res, next);
            break;
          case "standalone":
            executeStandaloneApi(models, req.params.objectId, req, res, next);
            break;
          case "signIn":
            executeSignInApi(models, req.params.objectId, req, res, next);
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
        models.objects.model
          .findOne({ objectId: "users", "data.username": username })
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
              if (!initialised)
                initServer(args, models, socket, socketInfo, () => {
                  console.log("Initialisation is done");
                  initialised = true;
                });
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
                  delete models.models.listeners[listener];
                  delete models.objects.listeners[listener];
                });
              }
            });
          }
        });
      });
    });
  })
  .catch((err) => {
    console.log(`No database found. Showing set-up instructions.`, err);
    app.get("/", function (req, res) {
      res.send("Hello World!");
    });
  });
