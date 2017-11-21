var moment = require("moment");
var jwt = require("jwt-simple");
var MultiLog = require("luispablo-multilog");

var consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);
var HTTP_TOKEN_HEADER = "x-access-token";
var HTTP_USERNAME_HEADER = "x-credentials-username";
var HTTP_PASSWORD_HEADER = "x-credentials-password";

module.exports = function (validTokens) {
	return function (authenticator, secret, validDays, logger) {
		var log = logger || consoleLogger;

		var TOKEN_EXPIRED_MESSAGE = "Token expired";
		var NONEXISTENT_TOKEN_MESSAGE = "Nonexistent token";
		var NOT_AUTHORIZED = "Not authorized to get this resource";

		function _doCreateToken (username, res, userData) {
			var expires = moment().add(validDays, "days").valueOf();
			var token = jwt.encode({iss: username, exp: expires}, secret);

			// Store for future validation
			validTokens.push(token);

			var user = userData ? userData : {};
			user.username = username;

			res.json({token: token, expires: expires, user: user});
		}

		function createToken (authorizedGroups) {
			return function (req, res) {
				var username = req.body.username;
				var password = req.body.password;

				if (username && password) {
					authenticator.authenticate(username, password).then(function (userData) {
						if (authorizedGroups && authorizedGroups.length > 0) {
							authenticator.groups(username).then(function (groups) {
								if (groups && groups.some(function (g) { return authorizedGroups.indexOf(g) >= 0; })) {
									_doCreateToken(username, res, userData);
								} else {
									log.debug("Not in the autorized groups to create token");
									res.status(403).send(NOT_AUTHORIZED);
								}
							}).catch(function (err) {
								log.debug(err);
								res.status(err.code || 500).json(err);
							});
						} else {
							_doCreateToken(username, res, userData);
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

    var validateCredentials = function validateCredentials (req, res, next) {
      var username = req.headers[HTTP_USERNAME_HEADER];
      var password = req.headers[HTTP_PASSWORD_HEADER];

      if (username && password) {
        authenticator.authenticate(username, password).then(function () {
          next();
        }).catch(function (e) {
          res.status(401).end();
        });
      } else {
        log.debug("No username or password provided");
        res.status(422).end();
      }
    };

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
      deleteToken: deleteToken,
      validateCredentials: validateCredentials
		};
	};
};
