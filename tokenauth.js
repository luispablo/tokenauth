"use strict";

const authFetch = require("./lib/authFetch");
const AppCheck = require("./lib/AppCheck");
const AuthFetch = require("./lib/AuthFetch");
const HTTPHeaderCheck = require("./lib/HTTPHeaderCheck");
const MultiLog = require("luispablo-multilog");
const Router = require("./lib/Router");
const tokensManager = require("./lib/tokensManager");
const UserCheck = require("./lib/UserCheck");

const consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);

const initTokenauth = function initTokenauth (config, logger) {
  const log = logger || consoleLogger;
  const tokens = tokensManager();
  const appCheck = AppCheck(config.staticKeys, log);
  const userCheck = UserCheck(tokens, config.token && config.token.secret, log);

  const tokenauth = {
    Middleware: HTTPHeaderCheck(appCheck, userCheck, log),
    Router: Router(tokens, config.roles)
  };
  
  return tokenauth;
};

initTokenauth.authFetch = authFetch;
initTokenauth.AuthFetch = AuthFetch;

module.exports = initTokenauth;
