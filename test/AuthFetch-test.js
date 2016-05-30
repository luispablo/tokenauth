const test = require("tape");
const AuthFetch = require("../lib/AuthFetch");

const TOKEN = "TEST_TOKEN";
const jwtMock = { token: TOKEN };
const body = { name: "test name", lastname: "test lastname" };

test("AuthFetch - Sets authentication header", assert => {
	assert.plan(1);
	const fetchMock = function (URL, options) {
		assert.equal(options.headers["x-access-token"], TOKEN, "Sets the token in HTTP header");
	};
	const authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL");
});

test("AuthFetch - Accepts JSON and content type JSON", assert => {
	assert.plan(2);
	const fetchMock = function (URL, options) {
		assert.equal(options.headers["Accept"], "application/json", "HTTP header accepts JSON");
		assert.equal(options.headers["Content-Type"], "application/json", "HTTP header content type JSON");
	};
	const authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL");
});

test("AuthFetch - Stringifies the body if it's not", assert => {
	assert.plan(1);
	const fetchMock = function (URL, options) {
		assert.equal(options.body, JSON.stringify(body), "The body is stringified");
	};
	const authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL", { method: "PUT", body: body });
});

test("AuthFetch - Leaves the body as is if it's already stringified", assert => {
	assert.plan(1);
	const fetchMock = function (URL, options) {
		assert.equal(options.body, JSON.stringify(body), "The body is stringified");
	};
	const authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL", { method: "PUT", body: JSON.stringify(body) });
});
