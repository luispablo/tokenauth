const test = require("tape");
const AppCheck = require("../lib/AppCheck");

const APP_1_ID = "App1";
const APP_1_KEY = "ajñklasdf687687asfhaskhakjsdhf";

const KEYS = [];
KEYS[APP_1_ID] = APP_1_KEY;

const check = AppCheck(KEYS);

test("AppCheck unexistent ID", assert => {
	assert.plan(1);
	check("unexistentId", APP_1_KEY).then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, "Invalid App ID", "Invalid app ID message");
	})
});

test("AppCheck invalid key", assert => {
	assert.plan(1);
	check(APP_1_ID, "invalid key").then(() => {
		assert.fail("Should have failed");
	}).catch(error => {
		assert.equal(error.message, `Invalid key for App ID ${APP_1_ID}`, "Invalid app key message");
	});
});

test("AppCheck valid ID / key pair", assert => {
	assert.plan(1);
	check(APP_1_ID, APP_1_KEY).then(() => {
		assert.pass("It works");
	}).catch(error => {
		assert.fail(error.message);
	});
});
