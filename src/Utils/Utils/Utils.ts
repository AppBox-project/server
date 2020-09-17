export const baseUrl = process.env.srvUrl
  ? process.env.srvUrl
  : "https://appbox.vicvancooten.nl";

export const systemLog = (msg: string | object) =>
  console.log(`Server: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
