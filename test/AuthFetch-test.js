const test = require("tape");
const AuthFetch = require("../lib/AuthFetch");

const TOKEN = "TEST_TOKEN";
const jwtMock = { token: TOKEN };

test("AuthFetch - Sets authentication header", assert => {
	assert.plan(1);
	const fetchMock = function (URL, options) {
		const expectedOptions = { headers: { "x-access-token": TOKEN } };
		assert.deepEqual(options, expectedOptions, "Sets the token in HTTP header");
	};
	const authFetch = AuthFetch(jwtMock, fetchMock);
	authFetch("random URL");
});
