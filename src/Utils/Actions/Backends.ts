const fork = require("child_process").fork;
const path = require("path");

export default [
  {
    key: "performBackendAction",
    action: (args, models, socket, socketInfo) => {
      if (typeof args.appId !== "string") {
        return;
      }

      console.log(args.appId);

      const program = path.resolve(`../../../../Backends/${args.appId}`);
      const parameters = [];
      const options = {
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      };

      const child = fork(program, parameters, options);
      child.on("message", (message) => {
        console.log("message from child:", message);
        child.send("Hi");
      });
    },
  },
];
