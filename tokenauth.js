"use strict";

const authFetch = require("./lib/authFetch");
const AppCheck = require("./lib/AppCheck");
const UserCheck = require("./lib/UserCheck");
const HTTPHeaderCheck = require("./lib/HTTPHeaderCheck");
const Router = require("./lib/Router");
const MultiLog = require("luispablo-multilog");
const AuthFetch = require("./lib/AuthFetch");

const consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);

const initTokenauth = function initTokenauth (config, logger) {
  const log = logger || consoleLogger;
  const validTokens = [];
  const appCheck = AppCheck(config.staticKeys, log);
  const userCheck = UserCheck(validTokens, config.token && config.token.secret, log);

  const tokenauth = {
    Middleware: HTTPHeaderCheck(appCheck, userCheck, log),
    Router: Router(validTokens, config.roles)
  };
  
  return tokenauth;
};

initTokenauth.authFetch = authFetch;
initTokenauth.AuthFetch = AuthFetch;

module.exports = initTokenauth;
