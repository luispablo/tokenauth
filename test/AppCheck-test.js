var test = require("tape");
var AppCheck = require("../lib/AppCheck");

var APP_1_ID = "App1";
var APP_1_KEY = "ajñklasdf687687asfhaskhakjsdhf";
var UNEXISTENT_ID = "unexistentId";

var KEYS = [];
KEYS[APP_1_ID] = APP_1_KEY;

var mockLog = { debug: function (msg) { this.lastMessage = msg; } };
var check = AppCheck(KEYS, mockLog);

test("AppCheck - is logging", function (assert) {
	check(UNEXISTENT_ID, APP_1_KEY).catch(function () {
		assert.equal(mockLog.lastMessage, UNEXISTENT_ID +" is not a valid application ID.", "Invalid app ID message");
		assert.end();
	});
});

test("AppCheck - unexistent ID", function (assert) {
	assert.plan(1);
	check(UNEXISTENT_ID, APP_1_KEY).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.equal(error.message, UNEXISTENT_ID +" is not a valid application ID.", "Invalid app ID message");
	})
});

test("AppCheck - invalid key", function (assert) {
	var INVALID_KEY = "invalid_key";
	assert.plan(1);
	check(APP_1_ID, INVALID_KEY).then(function () {
		assert.fail("Should have failed");
	}).catch(function (error) {
		assert.equal(error.message, INVALID_KEY +" key is invalid for the application ID "+ APP_1_ID +".", "Invalid app key message");
	});
});

test("AppCheck - valid ID / key pair", function (assert) {
	assert.plan(1);
	check(APP_1_ID, APP_1_KEY).then(function () {
		assert.pass("It works");
	}).catch(function (error) {
		assert.fail(error.message);
	});
});
