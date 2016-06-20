var test = require("tape");
var index = require("../index");
var AuthFetch = require("../lib/AuthFetch");

test("index - exports", function (assert) {
	assert.ok(index({}) !== null, "Something exported as default");
	assert.equal(index.AuthFetch, AuthFetch, "exports AuthFetch without invoking function");
	assert.end();
});
