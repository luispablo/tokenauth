var test = require("ava");
var jwt = require("jwt-simple");
var UserCheck = require("../lib/UserCheck");
const addDays = require("date-fns/add_days");
const subDays = require("date-fns/sub_days");

var SECRET = "secret";
var USERNAME_1 = "username1";
var USERNAME_2 = "username2";

var exp = addDays(new Date(), 7).getTime() / 1000; // 7 days from today
var DECODED_TOKEN_1 = {iss: USERNAME_1, exp };
var TOKEN_1 = jwt.encode(DECODED_TOKEN_1, SECRET);
var TOKEN_2 = jwt.encode({iss: USERNAME_2, exp }, SECRET);
var INVALID_TOKEN = "invalid_token";

var mockLog = { debug: function (msg) { this.lastMessge = msg; } };
var check = UserCheck([TOKEN_1, TOKEN_2], SECRET, mockLog);

test.cb("UserCheck - is logging", function (assert) {
	check(INVALID_TOKEN).catch(function () {
		assert.is(mockLog.lastMessge, "Invalid token", "Logged debug message");
		assert.end();
	});
});

test.serial("UserCheck - invalid token", async function (assert) {
	assert.plan(1);

	check(INVALID_TOKEN).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.is(error.message, "Invalid token", "Invalid token message");
	});
});

test.serial("UserCheck - expired token", async function (assert) {
	assert.plan(1);

  const yesterdayInSeconds = subDays(new Date(), 1).getTime() / 1000;
	var expiredToken = jwt.encode({ sub: USERNAME_1, exp: yesterdayInSeconds }, SECRET);
	var expiredCheck = UserCheck([expiredToken], SECRET, mockLog);

	expiredCheck(expiredToken).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.is(error.message, "Token expired", "Token expired message");
	})
});

test.serial("UserCheck - no valid tokens", async function (assert) {
	assert.plan(1);
	var emptyCheck = UserCheck([], SECRET, mockLog);

	emptyCheck(TOKEN_1).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.is(error.message, "Invalid token", "Invalid token message");
	});
});

test.serial("UserCheck - valid token", async function (assert) {
	assert.plan(1);

	check(TOKEN_1).then(function () {
		assert.pass("Token valid");
	}).catch(function (error) {
		assert.fail(error.message);
	});
});

test.cb("UserCheck - resolve with decoded token", function (assert) {
  check(TOKEN_1).then(function (decodedToken) {
    assert.deepEqual(decodedToken, DECODED_TOKEN_1);
    assert.end();
  });
});
