"use strict";

var test = require("ava");
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

const defaultReq = { body: { username: USERNAME, password: PASSWORD } };
const authOKEmpty = { authenticate: function () { return new Promise(function (resolve) { resolve({ }); }); } };

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

const roles = {
  "role1": { groups: ["group1", "group2"] },
  "role2": { groups: ["group2", "group3"] },
  "role3": { users: [USERNAME, "user2"] },
  "role4": { users: ["user2", "user3"] },
  "role5": { groups: ["group1", "group2"], users: ["user2", "user3"] },
  "role6": { groups: ["group2", "group3"], users: [USERNAME, "user2"] }
};

var routes = Router(validTokens, roles)(authenticatorMock, SECRET, VALIDITY_DAYS, mockLog);

test.serial("Router - Computed roles in token", async function (assert) {
  const auth = {
    authenticate: function () {
      return new Promise(function (resolve) { resolve({ groups: ["group3", "group4"] }); });
    }
  };

  assert.plan(3);
  
  resMock.json = function (object) {
    const user = object.user;
    assert.truthy(user.roles, "The roles are there");
    assert.is(user.roles.length, 3, "Has 3 roles");
    assert.deepEqual(user.roles, ["role2", "role3", "role6"], "Has this 3 given roles");
  };
  await Router(validTokens, roles)(auth, SECRET, VALIDITY_DAYS, mockLog).createToken(defaultReq, resMock);
});

test.serial("Router - is logging", function (assert) {
  reqMock.body = {};

  assert.plan(1);
  resMock.status = function () {
    assert.is(mockLog.lastMessage, "No username or password provided", "HTTP 422 message");
    return this;
  };

  routes.createToken(reqMock, resMock);
});

test.serial("Router - Create token", async function (assert) {
  assert.plan(2);
  resMock.json = function (object) {
    assert.truthy(object.token, "Exists the token property");
    assert.is(object.user.username, USERNAME, "Token built for the username provided");
  };
  await routes.createToken(defaultReq, resMock);
});

test.serial("Router - Unauthorized create token", async function (assert) {
  assert.plan(1);
  reqMock.body = { username: "another_user", password: PASSWORD };
  authenticatorMock.groups = function () { return new Promise(function (resolve) { resolve(["Group1", "TeamA"]); }); };
  resMock.json = function () {};
  resMock.status = function (code) { assert.is(code, 401, "HTTP not authenticated"); return this; };
  Router(validTokens, roles)(authenticatorMock, SECRET, VALIDITY_DAYS, mockLog).createToken(reqMock, resMock);
});

test.serial("Router - Authorized create token", async function (assert) {
  assert.plan(1);
  reqMock.body = { username: USERNAME, password: PASSWORD };
  authenticatorMock.groups = function () { return new Promise(function (resolve) { resolve(["group1", "TeamA"]); }); };
  resMock.json = function (object) { assert.truthy(object.token, "Exists the token property"); };
  Router(validTokens, roles)(authenticatorMock, SECRET, VALIDITY_DAYS, mockLog).createToken(reqMock, resMock);
});

test.serial("Router - No username or no password", async function (assert) {
  reqMock.body = {};
  assert.plan(1);
  resMock.status = function (code) {
    assert.is(code, 422, "HTTP error 422 because of missing credentials");
    return this;
  };
  routes.createToken(reqMock, resMock);
});

test.serial("Router - Invalid username or password", async function (assert) {
  resMock = buildResMock();
  reqMock.body.username = "invalid";
  reqMock.body.password = "invalid";

  assert.plan(1);
  resMock.status = function (code) {
    assert.is(code, 401, "HTTP error 401: unauthorized");
    return this;
  };
  routes.createToken(reqMock, resMock);
});

test.serial("Router - Free access when no roles specified", async function (assert) {
  reqMock.body.username = USERNAME;
  reqMock.body.password = PASSWORD;
  assert.plan(1);
  const res = { 
    status (status) { assert.is(200, status, "If called, should be 200"); }, 
    json () { assert.truthy("Everything is fine here"); } 
  };
  Router([])(authOKEmpty, SECRET, VALIDITY_DAYS, mockLog).createToken(reqMock, res);
});

test.serial("Router - Default role assigned", async function (assert) {
  const roles = { "default-role": { defaultRole: true } };
  assert.plan(1);
  const res = { json (token) { assert.deepEqual(token.user.roles, ["default-role"], "Default role assigned"); }};
  Router([], roles)(authOKEmpty, SECRET, VALIDITY_DAYS, mockLog).createToken(defaultReq, res);
});

test.serial("Router - Validate existing & valid token", async function (assert) {
  reqMock.body = {username: USERNAME, password: PASSWORD};

  assert.plan(1);

  resMock.json = function (token) {
    reqMock.headers = {"x-access-token": token.token};
    resMock.status = function (code) {
      assert.is(code, 200, "HTTP OK");
      return this;
    };
    routes.validateToken(reqMock, resMock);
  };

  routes.createToken(reqMock, resMock);
});

test.serial("Router - Validate non-existent token", async function (assert) {
  assert.plan(1);

  reqMock.headers = {"x-access-token": "nonexistent"};
  resMock.status = function (code) {
    assert.is(code, 401, "HTTP unauthorized");
    return this;
  };
  routes.validateToken(reqMock, resMock);
});

test.serial("Router - Validate expired token", async function (assert) {
  var expiredRoutes = Router(validTokens)(authenticatorMock, SECRET, -1, mockLog); // negative days for generating expired tokens
  reqMock.body = {username: USERNAME, password: PASSWORD};

  assert.plan(1);

  resMock.json = function (token) {
    reqMock.headers = {"x-access-token": token.token};
    resMock.status = function (code) {
      assert.is(code, 401, "HTTP unauthorized, expired");
      return this;
    };
    expiredRoutes.validateToken(reqMock, resMock);
  };

  expiredRoutes.createToken(reqMock, resMock);
});

test.serial("Router - validateCredentials - correct username and password in HTTP header", async function (assert) {
  assert.plan(1);
  const req = {
    headers: { "x-credentials-username": USERNAME, "x-credentials-password": PASSWORD }
  };
  const next = function () { assert.pass("Next invoked"); };
  routes.validateCredentials(req, null, next);
});

test.serial("Router - validateCredentials - no username or password in HTTP header", async function (assert) {
  assert.plan(1);
  const req = { headers: {} };
  const res = {
    status (code) {
      assert.is(code, 422, "The request is invalid");
      return { end () {} };
    }
  };
  routes.validateCredentials(req, res);
});

test.serial("Router - validateCredentials - incorrect password in HTTP header", async function (assert) {
  assert.plan(1);
  const req = {
    headers: { "x-credentials-username": "wronguser", "x-credentials-password": "wrongpass" }
  };
  const res = {
    status (code) {
      assert.is(code, 401, "HTTP Unauthorized");
      return { end () {} };
    }
  };
  routes.validateCredentials(req, res);
});

test.serial("Router - delete token", async function (assert) {
  reqMock.body.username = USERNAME;
  reqMock.body.password = PASSWORD;

  var deleteResMock = buildResMock();

  assert.plan(1);

  deleteResMock.json = function (token) {
    reqMock.headers = {"x-access-token": token};
    deleteResMock.end = function () {
      deleteResMock.status = function (code) {
        assert.is(code, 401, "No longer valid");
        return this;
      };
      routes.validateToken(reqMock, deleteResMock);
    };
    routes.deleteToken(reqMock, deleteResMock);
  };
  routes.createToken(reqMock, deleteResMock);
});
