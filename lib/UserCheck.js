const jwt = require("jwt-simple");

module.exports = function (validTokens, secret) {

	return function (token) {
		return new Promise((resolve, reject) => {
			if (validTokens.indexOf(token) < 0) {
				reject({status: 401, message: "Invalid token"});
			} else {
				var decodedToken = jwt.decode(token, secret);

				if (decodedToken.exp <= Date.now()) {
					reject({status: 400, message: "Access token has expired"});
				} else {
					resolve();
				}
			}
		});
	};
};
