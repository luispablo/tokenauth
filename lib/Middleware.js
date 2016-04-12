"use strict";

const HTTPHeaderCheck = require("./HTTPHeaderCheck");

module.exports = function (appCheck, userCheck, excludedRoutes) {
	return function (route) {
		if (excludedRoutes.indexOf(route) < 0) {
			return HTTPHeaderCheck(appCheck, userCheck);
		} else {
			return (req, res, next) => next();
		}
	};
};
