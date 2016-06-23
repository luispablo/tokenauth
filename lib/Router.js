var moment = require("moment");
var jwt = require("jwt-simple");
var MultiLog = require("luispablo-multilog");

var consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);
var HTTP_TOKEN_HEADER = "x-access-token";

module.exports = function (validTokens) {
	return function (authenticator, secret, validDays, logger) {
		var log = logger || consoleLogger;

		var TOKEN_EXPIRED_MESSAGE = "Token expired";
		var NONEXISTENT_TOKEN_MESSAGE = "Nonexistent token";
		var NOT_AUTHORIZED = "Not authorized to get this resource";

		function _doCreateToken (username, res) {
			var expires = moment().add(validDays, "days").valueOf();
			var token = jwt.encode({iss: username, exp: expires}, secret);

			// Store for future validation
			validTokens.push(token);

			res.json({token: token, expires: expires, user: {username: username}});
		}

		function createToken (authorizedGroups) {
			return function (req, res) {
				var username = req.body.username;
				var password = req.body.password;

				if (username && password) {
					authenticator.authenticate(username, password).then(function () {
						if (authorizedGroups && authorizedGroups.length > 0) {
							authenticator.groups(username).then(function (groups) {
								if (groups && groups.some(function (g) { return authorizedGroups.indexOf(g) >= 0; })) {
									_doCreateToken(username, res);
								} else {
									log.debug("Not in the autorized groups to create token");
									res.status(403).send(NOT_AUTHORIZED);
								}
							}).catch(function (err) {
								log.debug(err);
								res.status(err.code || 500).json(err);
							});
						} else {
							_doCreateToken(username, res);
						}
					}).catch(function (err) {
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
			var token = req.headers[HTTP_TOKEN_HEADER];

			if (token && validTokens.indexOf(token) >= 0) {
				var decodedToken = jwt.decode(token, secret);

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
			var token = req.headers[HTTP_TOKEN_HEADER];

			if (token && validTokens.indexOf(token) >= 0) {
				validTokens.splice(validTokens.indexOf(token), 1);
				res.status(200).end();
			} else {
				res.status(404).end();
			}
		}

		return {
			createToken: createToken,
			validateToken: validateToken,
			deleteToken: deleteToken
		};
	};
};
