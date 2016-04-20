const jwt = require("jwt-simple");

module.exports = function (validTokens, secret, log) {

	const INVALID_TOKEN_MESSAGE = "Invalid token";
	const EXPIRED_TOKEN_MESSAGE = "Access token has expired";

	return function (token) {
		return new Promise((resolve, reject) => {
			if (validTokens.indexOf(token) < 0) {
				log.debug(INVALID_TOKEN_MESSAGE);
				reject({status: 401, message: INVALID_TOKEN_MESSAGE});
			} else {
				var decodedToken = jwt.decode(token, secret);

				if (decodedToken.exp <= Date.now()) {
					log.debug(EXPIRED_TOKEN_MESSAGE);
					reject({status: 400, message: EXPIRED_TOKEN_MESSAGE});
				} else {
					resolve();
				}
			}
		});
	};
};
