const test = require("tape");
const jwt = require("jwt-simple");
const UserCheck = require("../lib/UserCheck");
const moment = require("moment");

const SECRET = "secret";
const USERNAME_1 = "username1";
const USERNAME_2 = "username2";

const inSevenDays = moment().add(7, 'days').valueOf();
const TOKEN_1 = jwt.encode({iss: USERNAME_1, exp: inSevenDays}, SECRET);
const TOKEN_2 = jwt.encode({iss: USERNAME_2, exp: inSevenDays}, SECRET);

const check = UserCheck([TOKEN_1, TOKEN_2], SECRET);

test("UserCheck invalid token", assert => {
	assert.plan(1);

	check("invalid_token").then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, "Invalid token", "Invalid token message");
	});
});

test("UserCheck expired token", assert => {
	assert.plan(1);

	const yesterday = moment().subtract(1, "days").valueOf();
	const expiredToken = jwt.encode({iss: USERNAME_1, exp: yesterday}, SECRET);
	const expiredCheck = UserCheck([expiredToken], SECRET);

	expiredCheck(expiredToken).then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, "Access token has expired", "Token expired message");
	})
});

test("UserCheck no valid tokens", assert => {
	assert.plan(1);
	const emptyCheck = UserCheck([], SECRET);

	emptyCheck(TOKEN_1).then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, "Invalid token", "Invalid token message");
	});
});

test("UserCheck valid token", assert => {
	assert.plan(1);

	check(TOKEN_1).then(() => {
		assert.pass("Token valid");
	}).catch(error => {
		assert.fail(error.message);
	});
});