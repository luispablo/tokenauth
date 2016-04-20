const moment = require("moment");
const jwt = require("jwt-simple");
const MultiLog = require("@luispablo/multilog");

const consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);
const HTTP_TOKEN_HEADER = "x-access-token";

module.exports = function (authenticator, secret, validDays, logger) {
	const log = logger || consoleLogger;
	const tokens = [];

	const TOKEN_EXPIRED_MESSAGE = "Token expired";
	const NONEXISTENT_TOKEN_MESSAGE = "Nonexistent token";

	function createToken (req, res) {
		const username = req.body.username;
		const password = req.body.password;

		if (username && password) {
			authenticator.authenticate(username, password).then(() => {
				const expires = moment().add(validDays, "days").valueOf();
				const token = jwt.encode({iss: username, exp: expires}, secret);

				// Store for future validation
				tokens.push(token);

				res.json({token: token, expires: expires, user: {username: username}});
			}).catch(err => {
				log.debug(typeof(err) == "string" ? err : JSON.stringify(err));
				res.status(err.code || 500).json(err);
			});
		} else {
			log.debug("No username or password provided");
			res.status(422).end();
		}
	}

	function validateToken (req, res) {
		const token = req.headers[HTTP_TOKEN_HEADER];

		if (token && tokens.indexOf(token) >= 0) {
			const decodedToken = jwt.decode(token, secret);

			if (decodedToken.exp > Date.now()) {
				res.status(200).end();
			} else {
				log.debug(TOKEN_EXPIRED_MESSAGE);
				res.status(401).send(TOKEN_EXPIRED_MESSAGE);
			}
		} else {
			log.debug(NONEXISTENT_TOKEN_MESSAGE);
			res.status(401).send(NONEXISTENT_TOKEN_MESSAGE);
		}
	}

	return {
		createToken, validateToken
	};
};
