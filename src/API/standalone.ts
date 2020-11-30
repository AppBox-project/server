import sanitizeString from "../Utils/Functions/SanitizeString";

const executeStandaloneApi = async (models, objectId, req, res, next) => {
  // Find configuration in appsettings based on the key we received and return it.
  const secret = sanitizeString(req.params.optional.split("-")[1]);
  const appId = sanitizeString(req.params.optional.split("-")[0]);
  const config = await models.appsettings.model.findOne({
    key: `standaloneConfig-${appId}`,
  });
  if (config) {
    if (config.value.secret === secret) {
      JSON.stringify(config);
    } else {
      JSON.stringify({ success: false, reason: "secret-does-not-match" });
    }
  } else {
    res.send(JSON.stringify({ success: false, reason: "app-key-not-found" }));
  }
};

export default executeStandaloneApi;
