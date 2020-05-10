const { fork } = require("child_process");
const path = require("path");

export default [
  {
    // --> performBackendAction
    // (action, args, requestId, appId)
    // -- Starts a nodejs child process (backend) and sends an instruction
    key: "performBackendAction",
    action: (args, models, socket, socketInfo) => {
      if (typeof args.appId !== "string") {
        return;
      }
      const backend = fork(
        `/AppBox/System/Backends/${args.appId}/build/index.js`
      );
      console.log(`Starting ${args.appId} backend`);
      backend.on("message", (message) => {
        switch (message) {
          case "ready":
            backend.send({ action: args.action, args: args.args });
            break;
          default:
            break;
        }
      });
    },
  },
];
