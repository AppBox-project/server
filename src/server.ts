import * as express from "express";
import config from "./config";
var mongoose = require("mongoose");
import actions from "./Utils/Actions";
import { map } from "lodash";

// Models
require("./Utils/Models/Objects");
require("./Utils/Models/Entries");

// Start up server
const app = express();
app.set("port", process.env.PORT || config.port);
app.use(express.static("../../Files/Public"));
let http = require("http").Server(app);
let io = require("socket.io")(http);

mongoose.connect(`mongodb://localhost/AppBox`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function() {
  // Models
  const models = {
    objects: {
      model: mongoose.model("Objects"),
      stream: db.collection("objects").watch(),
      listeners: {}
    },
    entries: {
      model: mongoose.model("Entries"),
      stream: db.collection("entries").watch(),
      listeners: {}
    }
  };

  // Change streams
  models.objects.stream.on("change", change => {
    map(models.objects.listeners, listener => {
      listener(change);
    });
  });
  models.entries.stream.on("change", change => {
    map(models.entries.listeners, listener => {
      listener(change);
    });
  });

  console.log("Connected to database and loaded models.");

  http.listen(config.port, () => {
    console.log(`Server open on http://localhost:${config.port}`);

    // Client interaction
    io.on("connection", (socket: any) => {
      const socketInfo = { listeners: [], permissions: ["public"] };
      console.log("A user connected");

      actions.map(action => {
        socket.on(action.key, args => {
          action.action(args, models, socket, socketInfo);
        });
      });

      socket.on("disconnect", () => {
        socketInfo.listeners.map(listener => {
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
