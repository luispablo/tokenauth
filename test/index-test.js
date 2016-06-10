const test = require("tape");
const index = require("../index")({});
const AuthFetch = require("../lib/AuthFetch");

test("index - exports", assert => {
	assert.ok(index !== null, "Something exported as default");
	assert.equal(index.AuthFetch, AuthFetch, "exports AuthFetch");
	assert.end();
});
