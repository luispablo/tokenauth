var test = require("tape");
var jwt = require("jwt-simple");
var moment = require("moment");
var TokenBuilder = require("../lib/TokenBuilder");

var SECRET = "secret";
var USERNAME = "username";
var DAYS = 7;

var validTokens = [];
var builder = TokenBuilder(validTokens, SECRET);

test("TokenBuilder - creates token", function (assert) {
	var token = builder(USERNAME, DAYS);
	var decoded = jwt.decode(token, SECRET);
	var expires = moment().add(DAYS, "days").valueOf();
	assert.equal(decoded.iss, USERNAME, "The encoded object inside the token");
	assert.end();
});

test("TokenBuilder - stores created token", function (assert) {
	var previousLength = validTokens.length;
	var token = builder(USERNAME, DAYS);
	assert.equal(validTokens.length, previousLength + 1, "Has one more valid token");
	assert.ok(validTokens.indexOf(token) >= 0, "The token is now in the valid tokens list");
	assert.end();
});
