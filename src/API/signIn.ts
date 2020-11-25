import { compareHashes, getToken } from "../Utils/Functions/User";
import sanitizeString from "../Utils/Functions/SanitizeString";

const executeSignInApi = async (models, objectId, req, res, next) => {
  if (req.body.standAloneCode) {
    // Sign in request for standalone apps.
    const appConfig = await models.appsettings.model.findOne({
      key: `standaloneConfig-${sanitizeString(req.body.standAloneCode)}`,
    });
    if (!appConfig) {
      // App doesn't exist.
      res.send(
        JSON.stringify({
          success: false,
          reason: "unknown-key",
        })
      );
    } else {
      if (appConfig.value.signInWith === "people") {
        const user = await models.objects.model.findOne({
          objectId: "people",
          "data.email": sanitizeString(req.body.user.username),
        });

        if (user) {
          if (compareHashes(req.body.user.password, user.data.password)) {
            res.send(
              JSON.stringify({
                success: true,
                token: getToken(user.data.email, user.data.password),
                username: user.data.email,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                success: false,
                reason: "sign-in-failed",
              })
            );
          }
        } else {
          res.send(
            JSON.stringify({
              success: false,
              reason: "sign-in-failed",
            })
          );
        }
      } else {
        res.send(
          JSON.stringify({
            success: false,
            reason: "not-implemented",
            description:
              "Sign in with user not implemented yet. Can only sign in with people.",
          })
        );
      }
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        reason: "not-implemented",
        description:
          "A direct sign in request has not been implemented yet. The closed off API is only available to standalone apps.",
      })
    );
  }
};

export default executeSignInApi;
