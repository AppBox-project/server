import config from "../../config";

var bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(10);

const getSecret = () => {
  const d = new Date();
  return d.getMonth() + d.getFullYear() + config.secret;
};

const compareHashes = (string, hash) => {
  return bcrypt.compareSync(string, hash);
};

const getToken = (username, password) => {
  return bcrypt.hashSync(getSecret() + username + password, salt);
};

const checkPersonToken = (person, token) => {
  return bcrypt.compareSync(
    getSecret() + person.data.email + person.data.password,
    token
  );
};

export default {
  hashString: (string) => {
    return bcrypt.hashSync(string, salt);
  },
  compareHashes,
  getToken,
  checkUserToken: (user, token) => {
    return bcrypt.compareSync(
      getSecret() + user.data.username + user.data.password,
      token
    );
  },
};

export { compareHashes, getToken, checkPersonToken };
