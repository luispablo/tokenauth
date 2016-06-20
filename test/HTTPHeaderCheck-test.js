var test = require("tape");
var HTTPHeaderCheck = require("../lib/HTTPHeaderCheck");

var req = {headers: []};
var res = {
	status: function (code) {
		this.code = code;
		return this;
	},
	end: function (object) { this.object = object; }
};
var mockLog = { debug: function (msg) { this.lastMessage = msg; } };

test("HTTPHeaderCheck - is logging", function (assert) {
	var logCheck = HTTPHeaderCheck(null, null, mockLog);
	logCheck(req, res);
	assert.equal(mockLog.lastMessage, "No token provided", "No token provided debug message");
	assert.end();
});

test("HTTPHeaderCheck - rejects no token", function (assert) {
	var headerCheck = HTTPHeaderCheck(null, null, mockLog);
	headerCheck(req, res);
	assert.equal(401, res.code);
	assert.end();
});

test("HTTPHeaderCheck - accepts valid user token", function (assert) {
	assert.plan(1);

	req.headers['x-access-token'] = "token";
	var userCheck = function () { return new Promise(function (resolve) { resolve(); }); };
	var headerCheck = HTTPHeaderCheck(null, userCheck, mockLog);
	var next = function () { assert.pass("next invoked"); };

	headerCheck(req, res, next);
});

test("HTTPHeaderCheck - rejects invalid user token", function (assert) {
	req.headers['x-access-token'] = "token";
	var userCheck = function () { return new Promise(function (resolve) { reject(); }); };
	var headerCheck = HTTPHeaderCheck(null, userCheck, mockLog);

	headerCheck(req, res);

	assert.equal(res.code, 401, "Should have failed");
	assert.end();
});

test("HTTPHeaderCheck - accepts valid app id / key", function (assert) {
	assert.plan(1);

	req.headers['x-access-app-id'] = "id";
	req.headers['x-access-token'] = "key";
	var appCheck = function () { return new Promise(function (resolve) { resolve(); }); };
	var headerCheck = HTTPHeaderCheck(appCheck, null, mockLog);
	var next = function () { assert.pass("next inoked"); };

	headerCheck(req, res, next);
});

test("HTTPHeaderCheck - rejects invalid app id / key", function (assert) {
	assert.plan(1);

	req.headers['x-access-app-id'] = "id";
	req.headers['x-access-token'] = "key";
	var error = { status: 401 };
	var appCheck = function () { return new Promise(function (resolve, reject) { reject(error); }); };
	var headerCheck = HTTPHeaderCheck(appCheck, null, mockLog);
	res.status = function (code) { assert.equal(code, error.status, "Should have failed"); };

	headerCheck(req, res);
});
