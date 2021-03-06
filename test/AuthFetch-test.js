var test = require("tape");
var AuthFetch = require("../lib/AuthFetch");

var TOKEN = "TEST_TOKEN";
var jwtMock = { token: TOKEN };
var body = { name: "test name", lastname: "test lastname" };

test("AuthFetch - Sets authentication header from JWT", function (assert) {
	assert.plan(1);
	var fetchMock = function (URL, options) {
		assert.equal(options.headers["x-access-token"], TOKEN, "Sets the token in HTTP header");
	};
	var authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL");
});

test("AuthFetch - Sets authentication header for static app ID + token", function (assert) {
  var appId = "APP_TEST_ID1";
  var token = "APP_TOKEN1";
  assert.plan(2);
  var fetchMock = function (URL, options) {
    assert.equal(options.headers["x-access-app-id"], appId, "Sets the app ID in HTTP header");
    assert.equal(options.headers["x-access-token"], token, "Sets the token in HTTP header");
  };
  var authFetch = AuthFetch({ appId: appId, token: token }, fetchMock);
  authFetch("random URL");
});

test("AuthFetch - Prevent Content-Type and JSON.stringify with multipart: true", function (assert) {
	assert.plan(2);
	var fetchMock = function (URL, options) {
		assert.notOk(options.headers["Content-Type"], "This shouldn't be set");
		assert.notEqual(typeof(options.body), "string", "The body shouldn't be stringified");
	};
	var authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("/someurl", { body: { id: 1 }, multipart: true });
});

test("AuthFetch - Accepts JSON and content type JSON", function (assert) {
	assert.plan(2);
	var fetchMock = function (URL, options) {
		assert.equal(options.headers["Accept"], "application/json", "HTTP header accepts JSON");
		assert.equal(options.headers["Content-Type"], "application/json", "HTTP header content type JSON");
	};
	var authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL");
});

test("AuthFetch - Stringifies the body if it's not", function (assert) {
	assert.plan(1);
	var fetchMock = function (URL, options) {
		assert.equal(options.body, JSON.stringify(body), "The body is stringified");
	};
	var authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL", { method: "PUT", body: body });
});

test("AuthFetch - Leaves the body as is if it's already stringified", function (assert) {
	assert.plan(1);
	var fetchMock = function (URL, options) {
		assert.equal(options.body, JSON.stringify(body), "The body is stringified");
	};
	var authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL", { method: "PUT", body: JSON.stringify(body) });
});
