"use strict";

const HTTPHeaderCheck = require("./HTTPHeaderCheck");

module.exports = function (appCheck, userCheck, excludedRoutes, log) {
	excludedRoutes = excludedRoutes || [];
	
	return function (route) {
		if (excludedRoutes.indexOf(route) < 0) {
			return HTTPHeaderCheck(appCheck, userCheck, log);
		} else {
			return (req, res, next) => next();
		}
	};
};
