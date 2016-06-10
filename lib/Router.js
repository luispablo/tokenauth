const moment = require("moment");
const jwt = require("jwt-simple");
const MultiLog = require("@luispablo/multilog");

const consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);
const HTTP_TOKEN_HEADER = "x-access-token";

module.exports = function (validTokens) {
	return function (authenticator, secret, validDays, logger) {
		const log = logger || consoleLogger;

		const TOKEN_EXPIRED_MESSAGE = "Token expired";
		const NONEXISTENT_TOKEN_MESSAGE = "Nonexistent token";
		const NOT_AUTHORIZED = "Not authorized to get this resource";

		function _doCreateToken (username, res) {
			const expires = moment().add(validDays, "days").valueOf();
			const token = jwt.encode({iss: username, exp: expires}, secret);

			// Store for future validation
			validTokens.push(token);

			res.json({token: token, expires: expires, user: {username: username}});
		}

		function createToken (authorizedGroups) {
			return function (req, res) {
				const username = req.body.username;
				const password = req.body.password;

				if (username && password) {
					authenticator.authenticate(username, password).then(() => {
						if (authorizedGroups && authorizedGroups.length > 0) {
							authenticator.groups(username).then(groups => {
								if (groups && groups.some(g => authorizedGroups.indexOf(g) >= 0)) {
									_doCreateToken(username, res);
								} else {
									log.debug("Not in the autorized groups to create token");
									res.status(403).send(NOT_AUTHORIZED);
								}
							}).catch(err => {
								log.debug(err);
								res.status(err.code || 500).json(err);
							});
						} else {
							_doCreateToken(username, res);
						}
					}).catch(err => {
						log.debug(err);
						res.status(err.code || 500).json(err);
					});
				} else {
					log.debug("No username or password provided");
					res.status(422).end();
				}
			};
		}

		function validateToken (req, res) {
			const token = req.headers[HTTP_TOKEN_HEADER];

			if (token && validTokens.indexOf(token) >= 0) {
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

		function deleteToken (req, res) {
			const token = req.headers[HTTP_TOKEN_HEADER];

			if (token && validTokens.indexOf(token) >= 0) {
				validTokens.splice(validTokens.indexOf(token), 1);
				res.status(200).end();
			} else {
				res.status(404).end();
			}
		}

		return {
			createToken, validateToken, deleteToken
		};
	};
};
