const jwt = require("jwt-simple");
const moment = require("moment");

module.exports = function (validTokens) {
	return function (username, days, secret) {
		const expires = moment().add(days, "days").valueOf();
		const token = jwt.encode({iss: username, exp: expires}, secret);

		validTokens.push(token);

		return token;
	};
};