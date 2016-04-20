const test = require("tape");
const AppCheck = require("../lib/AppCheck");

const APP_1_ID = "App1";
const APP_1_KEY = "ajñklasdf687687asfhaskhakjsdhf";
const UNEXISTENT_ID = "unexistentId";

const KEYS = [];
KEYS[APP_1_ID] = APP_1_KEY;

const mockLog = { debug (msg) { this.lastMessage = msg; } };
const check = AppCheck(KEYS, mockLog);

test("AppCheck - is logging", assert => {
	check(UNEXISTENT_ID, APP_1_KEY).catch(() => {
		assert.equal(mockLog.lastMessage, `${UNEXISTENT_ID} is not a valid application ID.`, "Invalid app ID message");
		assert.end();
	});
});

test("AppCheck - unexistent ID", assert => {
	assert.plan(1);
	check(UNEXISTENT_ID, APP_1_KEY).then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, `${UNEXISTENT_ID} is not a valid application ID.`, "Invalid app ID message");
	})
});

test("AppCheck - invalid key", assert => {
	const INVALID_KEY = "invalid_key";
	assert.plan(1);
	check(APP_1_ID, INVALID_KEY).then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, `${INVALID_KEY} key is invalid for the application ID ${APP_1_ID}.`, "Invalid app key message");
	});
});

test("AppCheck - valid ID / key pair", assert => {
	assert.plan(1);
	check(APP_1_ID, APP_1_KEY).then(() => {
		assert.pass("It works");
	}).catch(error => {
		assert.fail(error.message);
	});
});
