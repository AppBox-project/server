import sanitizeString from "../Utils/Functions/SanitizeString";

const executeStandaloneApi = async (models, objectId, req, res, next) => {
  // Find configuration in appsettings based on the key we received and return it.
  const config = await models.appsettings.model.findOne({
    key: `standaloneConfig-${sanitizeString(req.params.optional)}`,
  });
  res.send(
    JSON.stringify(
      config ? config.value : { success: false, reason: "app-key-not-found" }
    )
  );
};

export default executeStandaloneApi;
