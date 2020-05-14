import config from "../../config";

var bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(10);

const getSecret = () => {
  const d = new Date();
  return d.getMonth() + d.getFullYear() + config.secret;
};

export default {
  hashString: (string) => {
    return bcrypt.hashSync(string, salt);
  },
  compareHashes: (string, hash) => {
    return bcrypt.compareSync(string, hash);
  },
  getToken: (username, password) => {
    return bcrypt.hashSync(getSecret() + username + password, salt);
  },
  checkUserToken: (user, token) => {
    return bcrypt.compareSync(
      getSecret() + user.data.username + user.data.password,
      token
    );
  },
};
