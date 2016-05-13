"use strict";

const test = require("tape");
const moment = require("moment");
const jwt = require("jwt-simple");
const Router = require("../lib/Router");

const USERNAME = "username";
const PASSWORD = "password";
const SECRET = "secret";
const VALIDITY_DAYS = 7;

const authenticatorMock = {
	authenticate (username, password) {
		return new Promise((resolve, reject) => {
			if (username === USERNAME && password === PASSWORD) resolve();
			else reject({code: 401, message: "Invalid username or password"});
		});
	}
};
const mockLog = { debug(msg) { this.lastMessage = msg; } };
const reqMock = {body: {}};

const buildResMock = () => {
	return {
		status (code) { this.statusCode = code; return this; },
		sendStatus (code) { this.status(code); },
		send (message) { this.object = message; },
		json (object) { this.object = object; },
		end () {}
	};
};

const resMock = buildResMock();
const validTokens = [];

const routes = Router(validTokens)(authenticatorMock, SECRET, VALIDITY_DAYS, mockLog);

test("Router - is logging", assert => {
	reqMock.body = {};

	assert.plan(1);
	resMock.status = function (code) {
		assert.equal(mockLog.lastMessage, "No username or password provided", "HTTP 422 message");
		return this;
	};

	routes.createToken(reqMock, resMock);
});

test("Router - Create token", assert => {
	reqMock.body.username = USERNAME;
	reqMock.body.password = PASSWORD;

	assert.plan(2);

	resMock.json = (object) => {
		assert.ok(object.token, "Exists the token property");
		assert.equal(object.user.username, USERNAME, "Token built for the username provided");
	};

	routes.createToken(reqMock, resMock);
});

test("Router - No username or no password", assert => {
	reqMock.body = {};

	assert.plan(1);
	resMock.status = function (code) {
		assert.equal(code, 422, "HTTP error 422 because of missing credentials");
		return this;
	};

	routes.createToken(reqMock, resMock);
});

test("Router - Invalid username or password", assert => {
	reqMock.body.username = "invalid";
	reqMock.body.password = "invalid";

	assert.plan(1);

	resMock.status = function (code) {
		assert.equal(code, 401, "HTTP error 401: unauthorized");
	};

	routes.createToken(reqMock, resMock);
});

test("Router - Validate existing & valid token", assert => {
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

	routes.createToken(reqMock, resMock);
});

test("Router - Validate non-existent token", assert => {
	assert.plan(1);

	reqMock.headers = {"x-access-token": "nonexistent"};
	resMock.status = function (code) {
		assert.equal(code, 401, "HTTP unauthorized");
		return this;
	};
	routes.validateToken(reqMock, resMock);
});

test("Router - Validate expired token", assert => {
	const expiredRoutes = Router(validTokens)(authenticatorMock, SECRET, -1, mockLog); // negative days for generating expired tokens
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

	expiredRoutes.createToken(reqMock, resMock);
});

test("Router - delete token", assert => {
	reqMock.body.username = USERNAME;
	reqMock.body.password = PASSWORD;

	const deleteResMock = buildResMock();

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
	routes.createToken(reqMock, deleteResMock);
});
