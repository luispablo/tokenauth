var test = require("ava");
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

test.serial("Is logging", function (assert) {
  var logCheck = HTTPHeaderCheck(null, null, mockLog);
  logCheck(req, res);
  assert.is(mockLog.lastMessage, "No token provided", "No token provided debug message");
});

test.serial("Rejects no token", function (assert) {
  var headerCheck = HTTPHeaderCheck(null, null, mockLog);
  headerCheck(req, res);
  assert.is(401, res.code);
});

test.serial("Accepts valid user token", async function (assert) {
  assert.plan(1);

  req.headers['x-access-token'] = "token";
  var userCheck = function () { return new Promise(function (resolve) { resolve(); }); };
  var headerCheck = HTTPHeaderCheck(null, userCheck, mockLog);
  var next = function () { assert.pass("next invoked"); };

  headerCheck(req, res, next);
});

test.serial("Rejects invalid user token", function (assert) {
  req.headers['x-access-token'] = "token";
  var userCheck = function () { return new Promise(function (resolve, reject) { reject(); }); };
  var headerCheck = HTTPHeaderCheck(null, userCheck, mockLog);

  headerCheck(req, res);

  assert.is(res.code, 401, "Should have failed");
});

test.serial("Accepts valid app id / key", async function (assert) {
  assert.plan(1);

  req.headers['x-access-app-id'] = "id";
  req.headers['x-access-token'] = "key";
  var appCheck = function () { return new Promise(function (resolve) { resolve(); }); };
  var headerCheck = HTTPHeaderCheck(appCheck, null, mockLog);
  var next = function () { assert.pass("next inoked"); };

  headerCheck(req, res, next);
});

test.serial("Rejects invalid app id / key", async function (assert) {
  req.headers['x-access-app-id'] = "id";
  req.headers['x-access-token'] = "key";
  var error = { status: 401 };
  var appCheck = function () { return new Promise(function (resolve, reject) { reject(error); }); };
  var headerCheck = HTTPHeaderCheck(appCheck, null, mockLog);
  res.status = function (code) { 
    assert.is(code, error.status, "Should have failed"); 
    return this;
  };
  await headerCheck(req, res);
});

test.serial.cb("Sets decoded token req", function (assert) {
  var decodedToken = { iss: "test_username", exp: 1318874398806 };
  req.headers["x-access-app-id"] = null;

  var userCheck = function () {
    return new Promise(function (resolve) { resolve(decodedToken); });
  };
  var headerCheck = HTTPHeaderCheck(null, userCheck, mockLog);
  var next = function () {
    assert.falsy(req.authUsername, "Remove this ugly feature");
    assert.deepEqual(req.decodedToken, decodedToken, "The decoded JWT token");
    assert.end();
  };
  headerCheck(req, res, next);
});

