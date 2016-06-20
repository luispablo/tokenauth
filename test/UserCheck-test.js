var test = require("tape");
var jwt = require("jwt-simple");
var UserCheck = require("../lib/UserCheck");
var moment = require("moment");

var SECRET = "secret";
var USERNAME_1 = "username1";
var USERNAME_2 = "username2";

var inSevenDays = moment().add(7, 'days').valueOf();
var TOKEN_1 = jwt.encode({iss: USERNAME_1, exp: inSevenDays}, SECRET);
var TOKEN_2 = jwt.encode({iss: USERNAME_2, exp: inSevenDays}, SECRET);
var INVALID_TOKEN = "invalid_token";

var mockLog = { debug: function (msg) { this.lastMessge = msg; } };
var check = UserCheck([TOKEN_1, TOKEN_2], SECRET, mockLog);

test("UserCheck - is logging", function (assert) {
	check(INVALID_TOKEN).catch(function () {
		assert.equal(mockLog.lastMessge, "Invalid token", "Logged debug message");
		assert.end();
	});
});

test("UserCheck - invalid token", function (assert) {
	assert.plan(1);

	check(INVALID_TOKEN).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.equal(error.message, "Invalid token", "Invalid token message");
	});
});

test("UserCheck - expired token", function (assert) {
	assert.plan(1);

	var yesterday = moment().subtract(1, "days").valueOf();
	var expiredToken = jwt.encode({iss: USERNAME_1, exp: yesterday}, SECRET);
	var expiredCheck = UserCheck([expiredToken], SECRET, mockLog);

	expiredCheck(expiredToken).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.equal(error.message, "Access token has expired", "Token expired message");
	})
});

test("UserCheck - no valid tokens", function (assert) {
	assert.plan(1);
	var emptyCheck = UserCheck([], SECRET, mockLog);

	emptyCheck(TOKEN_1).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.equal(error.message, "Invalid token", "Invalid token message");
	});
});

test("UserCheck - valid token", function (assert) {
	assert.plan(1);

	check(TOKEN_1).then(function () {
		assert.pass("Token valid");
	}).catch(function (error) {
		assert.fail(error.message);
	});
});
