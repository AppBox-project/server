var shell = require("shelljs");

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
      console.log("Executing backend function");

      const result = shell.exec(
        `yarn --cwd /AppBox/System/Backends/${args.appId} start ${process.env.DBURL} ${args.args.id}`
      );

      console.log("Backend function succesfully executed.");
      socket.emit(`receive-${args.requestId}`, {
        success: true,
        result,
      });
    },
  },
];
