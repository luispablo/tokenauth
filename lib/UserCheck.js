var jwt = require("jwt-simple");

module.exports = function (tokens, secret, log) {

  var INVALID_TOKEN_MESSAGE = "Invalid token";
  var EXPIRED_TOKEN_MESSAGE = "Token expired";

  return function (token) {
    return new Promise(function (resolve, reject) {
      if (tokens.exists(token)) {
        const decodedToken = jwt.decode(token, secret);
        const now = Math.round(Date.now() / 1000); // expressed in seconds

        if (decodedToken.exp <= now) {
          log.debug(EXPIRED_TOKEN_MESSAGE);
          reject({status: 400, message: EXPIRED_TOKEN_MESSAGE});
        } else {
          resolve(decodedToken);
        }
      } else {
        log.debug(INVALID_TOKEN_MESSAGE);
        reject({status: 401, message: INVALID_TOKEN_MESSAGE});
      }
    });
  };
};
