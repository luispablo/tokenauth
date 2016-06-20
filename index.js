"use strict";

var AppCheck = require("./lib/AppCheck");
var UserCheck = require("./lib/UserCheck");
var HTTPHeaderCheck = require("./lib/HTTPHeaderCheck");
var TokenBuilder = require("./lib/TokenBuilder");
var Router = require("./lib/Router");
var MultiLog = require("@luispablo/multilog");
var AuthFetch = require("./lib/AuthFetch");

var consoleLogger = MultiLog([{name: "console", level: "ERROR"}]);

var tokenauth = function (config, logger) {
	var log = logger || consoleLogger;
	var validTokens = [];
	var appCheck = AppCheck(config.staticKeys, log);
	var userCheck = UserCheck(validTokens, config.secret, log);

	return {
		Middleware: HTTPHeaderCheck(appCheck, userCheck, log),
		TokenBuilder: TokenBuilder(validTokens),
		Router: Router(validTokens)
	};
};

tokenauth.AuthFetch = AuthFetch;

module.exports = tokenauth;
