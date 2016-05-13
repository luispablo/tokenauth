const test = require("tape");

test("index - exports default", assert => {
	const index = require("../index");
	assert.ok(index !== null, "Something exported as default");
	assert.end();
});

test("index - exports AuthFetch", assert => {
	const AuthFetch = require("../index").AuthFetch;
	assert.equal(typeof(AuthFetch), "function", "Exports the auth fetch function");
	assert.end();
});
