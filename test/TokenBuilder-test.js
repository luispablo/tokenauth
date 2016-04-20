const test = require("tape");
const jwt = require("jwt-simple");
const moment = require("moment");
const TokenBuilder = require("../lib/TokenBuilder");

const SECRET = "secret";
const USERNAME = "username";
const DAYS = 7;

const validTokens = [];
const builder = TokenBuilder(validTokens, SECRET);

test("TokenBuilder - creates token", assert => {
	const token = builder(USERNAME, DAYS);
	const decoded = jwt.decode(token, SECRET);
	const expires = moment().add(DAYS, "days").valueOf();
	assert.equal(decoded.iss, USERNAME, "The encoded object inside the token");
	assert.end();
});

test("TokenBuilder - stores created token", assert => {
	const previousLength = validTokens.length;
	const token = builder(USERNAME, DAYS);
	assert.equal(validTokens.length, previousLength + 1, "Has one more valid token");
	assert.ok(validTokens.indexOf(token) >= 0, "The token is now in the valid tokens list");
	assert.end();
});
