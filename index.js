"use strict";

const AppCheck = require("./lib/AppCheck");
const UserCheck = require("./lib/UserCheck");
const Middleware = require("./lib/Middleware");
const TokenBuilder = require("./lib/TokenBuilder");
const Router = require("./lib/Router");
const MultiLog = require("@luispablo/multilog");
const AuthFetch = require("./lib/AuthFetch");

const consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);

const tokenauth = function (config, logger) {
	const log = logger || consoleLogger;
	const validTokens = [];
	const appCheck = AppCheck(config.staticKeys, log);
	const userCheck = UserCheck(validTokens, config.secret, log);

	return {
		Middleware: Middleware(appCheck, userCheck, config.excludedRoutes, log),
		TokenBuilder: TokenBuilder(validTokens),
		Router: Router(validTokens)
	};
};

tokenauth.AuthFetch = AuthFetch;

module.exports = tokenauth;
