"use strict";

const AppCheck = require("./lib/AppCheck");
const UserCheck = require("./lib/UserCheck");
const Middleware = require("./lib/Middleware");
const TokenBuilder = require("./lib/TokenBuilder");

module.exports = function (config) {
	const validTokens = [];
	const appCheck = AppCheck(config.staticKeys);
	const userCheck = UserCheck(validTokens, config.secret);

	return {
		Middleware: Middleware(appCheck, userCheck, config.excludedRoutes),
		TokenBuilder: TokenBuilder(validTokens)
	};
};
