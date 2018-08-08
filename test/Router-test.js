"use strict";

var test = require("tape");
var Router = require("../lib/Router");

var USERNAME = "username";
var PASSWORD = "password";
var SECRET = "secret";
var VALIDITY_DAYS = 7;

var authenticatorMock = {
  authenticate: function (username, password) {
    return new Promise(function (resolve, reject) {
      if (username === USERNAME && password === PASSWORD) resolve();
      else reject({code: 401, message: "Invalid username or password"});
    });
  }
};
var mockLog = { debug: function (msg) { this.lastMessage = msg; } };
var reqMock = {body: {}};

var buildResMock = function () {
  return {
    status: function (code) { this.statusCode = code; return this; },
    sendStatus: function (code) { this.status(code); },
    send: function (message) { this.object = message; },
    json: function (object) { this.object = object; },
    end: function () {}
  };
};

var resMock = buildResMock();
var validTokens = [];

var routes = Router(validTokens)(authenticatorMock, SECRET, VALIDITY_DAYS, mockLog);

test("Router - is logging", function (assert) {
  reqMock.body = {};

  assert.plan(1);
  resMock.status = function () {
    assert.equal(mockLog.lastMessage, "No username or password provided", "HTTP 422 message");
    return this;
  };

  routes.createToken()(reqMock, resMock);
});

test("Router - Create token", function (assert) {
  reqMock.body.username = USERNAME;
  reqMock.body.password = PASSWORD;

  assert.plan(2);

  resMock.json = function (object) {
    assert.ok(object.token, "Exists the token property");
    assert.equal(object.user.username, USERNAME, "Token built for the username provided");
  };

  routes.createToken()(reqMock, resMock);
});

test("Router - Additional data in token", function (assert) {
  assert.plan(3);
  var additionalData = { field1: "value1", field2: "value2" };
  var additionalDataAuth = {
    authenticate: function () {
      return new Promise(function (resolve) { resolve(additionalData); });
    }
  };
  resMock.json = function (object) {
    assert.equal(object.user.username, "username", "The username is still there");
    assert.equal(object.user.field1, additionalData.field1, "First additional data field");
    assert.equal(object.user.field2, additionalData.field2, "Second additional data field");
  };
  var routesAdditionalData = Router(validTokens)(additionalDataAuth, SECRET, VALIDITY_DAYS, mockLog);
  routesAdditionalData.createToken()(reqMock, resMock);
});

test("Router - Unauthorized create token", function (assert) {
  assert.plan(1);
  reqMock.body = { username: USERNAME, password: PASSWORD };
  authenticatorMock.groups = function () { return new Promise(function (resolve) { resolve(["Group1", "TeamA"]); }); };
  resMock.json = function () {};
  resMock.status = function (code) { assert.equal(code, 403, "HTTP unauthorized"); return this; };
  routes.createToken(["Group2", "TeamB"])(reqMock, resMock);
});

test("Router - Authorized create token", function (assert) {
  assert.plan(1);
  reqMock.body = { username: USERNAME, password: PASSWORD };
  authenticatorMock.groups = function () { return new Promise(function (resolve) { resolve(["Group1", "TeamA"]); }); };
  resMock.json = function (object) { assert.ok(object.token, "Exists the token property"); };
  routes.createToken(["Group2", "TeamA"])(reqMock, resMock);
});

test("Router - No username or no password", function (assert) {
  reqMock.body = {};

  assert.plan(1);
  resMock.status = function (code) {
    assert.equal(code, 422, "HTTP error 422 because of missing credentials");
    return this;
  };

  routes.createToken()(reqMock, resMock);
});

test("Router - Invalid username or password", function (assert) {
  resMock = buildResMock();
  reqMock.body.username = "invalid";
  reqMock.body.password = "invalid";

  assert.plan(1);

  resMock.status = function (code) {
    assert.equal(code, 401, "HTTP error 401: unauthorized");
    return this;
  };

  routes.createToken()(reqMock, resMock);
});

test("Router - Validate existing & valid token", function (assert) {
  reqMock.body = {username: USERNAME, password: PASSWORD};

  assert.plan(1);

  resMock.json = function (token) {
    reqMock.headers = {"x-access-token": token.token};
    resMock.status = function (code) {
      assert.equal(code, 200, "HTTP OK");
      return this;
    };
    routes.validateToken(reqMock, resMock);
  };

  routes.createToken()(reqMock, resMock);
});

test("Router - Validate non-existent token", function (assert) {
  assert.plan(1);

  reqMock.headers = {"x-access-token": "nonexistent"};
  resMock.status = function (code) {
    assert.equal(code, 401, "HTTP unauthorized");
    return this;
  };
  routes.validateToken(reqMock, resMock);
});

test("Router - Validate expired token", function (assert) {
  var expiredRoutes = Router(validTokens)(authenticatorMock, SECRET, -1, mockLog); // negative days for generating expired tokens
  reqMock.body = {username: USERNAME, password: PASSWORD};

  assert.plan(1);

  resMock.json = function (token) {
    reqMock.headers = {"x-access-token": token.token};
    resMock.status = function (code) {
      assert.equal(code, 401, "HTTP unauthorized, expired");
      return this;
    };
    expiredRoutes.validateToken(reqMock, resMock);
  };

  expiredRoutes.createToken()(reqMock, resMock);
});

test("Router - validateCredentials - correct username and password in HTTP header", function (assert) {
  assert.plan(1);
  const req = {
    headers: { "x-credentials-username": USERNAME, "x-credentials-password": PASSWORD }
  };
  const next = function () { assert.pass("Next invoked"); };
  routes.validateCredentials(req, null, next);
});

test("Router - validateCredentials - no username or password in HTTP header", function (assert) {
  assert.plan(1);
  const req = { headers: {} };
  const res = {
    status (code) {
      assert.equal(code, 422, "The request is invalid");
      return { end () {} };
    }
  };
  routes.validateCredentials(req, res);
});

test("Router - validateCredentials - incorrect password in HTTP header", function (assert) {
  assert.plan(1);
  const req = {
    headers: { "x-credentials-username": "wronguser", "x-credentials-password": "wrongpass" }
  };
  const res = {
    status (code) {
      assert.equal(code, 401, "HTTP Unauthorized");
      return { end () {} };
    }
  };
  routes.validateCredentials(req, res);
});

test("Router - delete token", function (assert) {
  reqMock.body.username = USERNAME;
  reqMock.body.password = PASSWORD;

  var deleteResMock = buildResMock();

  assert.plan(1);

  deleteResMock.json = function (token) {
    reqMock.headers = {"x-access-token": token};
    deleteResMock.end = function () {
      deleteResMock.status = function (code) {
        assert.equal(code, 401, "No longer valid");
        return this;
      };
      routes.validateToken(reqMock, deleteResMock);
    };
    routes.deleteToken(reqMock, deleteResMock);
  };
  routes.createToken()(reqMock, deleteResMock);
});
