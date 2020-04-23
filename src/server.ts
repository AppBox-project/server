import * as express from "express";
import config from "./config";
var mongoose = require("mongoose");
import actions from "./Utils/Actions";
import { map } from "lodash";

// Models
require("./Utils/Models/Objects");
require("./Utils/Models/Entries");
require("./Utils/Models/AppPermissions");

// Start up server
const app = express();
app.set("port", config.port);
// Serve public files
app.use("/public", express.static("../../Files/Public"));
// Exclude react build resources
// Catch all regular build files
// Todo this can be less ugly
app.use("/:filename.:extension", function (req, res) {
  var filename = req.params.filename;
  var extension = req.params.extension;
  if (req.get("host").match("localhost")) {
    // Debug for dev, remove later
    res.sendFile(
      `/home/duveaux/AppBox/System/Client/build/${filename}.${extension}`
    );
  } else {
    res.sendFile(`/AppBox/System/Client/build/${filename}.${extension}`);
  }
});
// Serve react
app.use("/*", express.static("../Client/build"));

let http = require("http").Server(app);
let io = require("socket.io")(http);

mongoose.connect(
  `mongodb://${
    process.env.DBURL ? process.env.DBURL : "192.168.0.2:27017"
  }/AppBox`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function () {
  // Models
  const models = {
    objects: {
      model: mongoose.model("Objects"),
      stream: db.collection("objects").watch(),
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

  console.log("Connected to database and loaded models.");

  http.listen(config.port, () => {
    console.log(`Server open on http://localhost:${config.port}`);

    // Client interaction
    io.on("connection", (socket: any) => {
      const socketInfo = {
        listeners: [],
        permissions: ["public"],
        username: undefined,
      };
      console.log("A user connected");

      actions.map((action) => {
        socket.on(action.key, (args) => {
          action.action(args, models, socket, socketInfo);
        });
      });

      socket.on("disconnect", () => {
        socketInfo.listeners.map((listener) => {
          delete models.objects.listeners[listener];
          delete models.entries.listeners[listener];
          console.log(
            "Session closed, deleted unneccessary listener.",
            listener
          );
        });
      });
    });
  });
});
