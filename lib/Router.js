"use strict";

const jwt = require("jwt-simple");

const HTTP_TOKEN_HEADER = "x-access-token";
const HTTP_USERNAME_HEADER = "x-credentials-username";
const HTTP_PASSWORD_HEADER = "x-credentials-password";

module.exports = function (validTokens, systemRoles) {
  return function (authenticator, secret, validDays, logger) {
    const MultiLog = require("luispablo-multilog");
    const addDays = require("date-fns/add_days");

    const consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);

    const log = logger || consoleLogger;

    const TOKEN_EXPIRED_MESSAGE = "Token expired";
    const NONEXISTENT_TOKEN_MESSAGE = "Nonexistent token";
    const NOT_AUTHENTICATED = "The server doesn't know your identity, or cannot validate it";

    const _doCreateToken = function _doCreateToken (username, userData) {
      const exp = Math.round(addDays(new Date(), validDays).getTime() / 1000);
      const sub = username;

      const token = jwt.encode({ sub, exp }, secret);

      // Store for future validation
      validTokens.push(token);

      const user = userData ? userData : {};
      user.username = username;
      user.roles = systemRoles ? Object.getOwnPropertyNames(systemRoles).map(function (roleName) {
        const role = systemRoles[roleName];
        const roleHasUser = role.users && role.users.indexOf(username) >= 0;
        const roleHasUserGroup = role.groups && user.groups && role.groups.some(g => user.groups.indexOf(g) >= 0);

        return role.defaultRole || roleHasUser || roleHasUserGroup ? roleName : null;
      }).filter(r => r) : [];

      return { token, exp, user };
    }

    const createToken = function createToken (req, res) {
      const username = req.body.username;
      const password = req.body.password;

      if (username && password) {
        authenticator.authenticate(username, password).then(function (userData) {
          const token = _doCreateToken(username, userData);

          if (systemRoles && token.user.roles.length === 0) {
            log.debug("User ["+ username +"] isn't in any of the specified roles.");
            res.status(401).send(NOT_AUTHENTICATED);
          } else {
            res.json(token);
          }
        }).catch(function (err) {
          log.debug(err);
          res.status(err.code || 500).json(err);
        });
      } else {
        log.debug("No username or password provided");
        res.status(422).end();
      }
    }

    function validateToken (req, res) {
      const token = req.headers[HTTP_TOKEN_HEADER];

      if (token && validTokens.indexOf(token) >= 0) {
        try {
          jwt.decode(token, secret);
          res.status(200).end();
        } catch (e) {
          if (e.message && e.message.indexOf("expired") >= 0) {
            res.status(401).send(TOKEN_EXPIRED_MESSAGE);
          } else {
            throw e;
          }
        }
      } else {
        log.debug(NONEXISTENT_TOKEN_MESSAGE);
        res.status(401).send(NONEXISTENT_TOKEN_MESSAGE);
      }
    }

    const validateCredentials = function validateCredentials (req, res, next) {
      const username = req.headers[HTTP_USERNAME_HEADER];
      const password = req.headers[HTTP_PASSWORD_HEADER];

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
      const token = req.headers[HTTP_TOKEN_HEADER];

      if (token && validTokens.indexOf(token) >= 0) {
        validTokens.splice(validTokens.indexOf(token), 1);
        res.status(200).end();
      } else {
        res.status(404).end();
      }
    }

    const getRoles = function getRoles () {
      return systemRoles;
    };

    return {
      createToken: createToken,
      deleteToken: deleteToken,
      getRoles: getRoles,
      validateCredentials: validateCredentials,
      validateToken: validateToken
    };
  };
};
