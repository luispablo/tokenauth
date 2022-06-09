var test = require("ava");
var AppCheck = require("../lib/AppCheck");

var APP_1_ID = "App1";
var APP_1_KEY = "ajñklasdf687687asfhaskhakjsdhf";
var UNEXISTENT_ID = "unexistentId";

var KEYS = [];
KEYS[APP_1_ID] = APP_1_KEY;

var mockLog = { debug: function (msg) { this.lastMessage = msg; } };
var check = AppCheck(KEYS, mockLog);

test.serial.cb("Is logging", function (assert) {
  check(UNEXISTENT_ID, APP_1_KEY).catch(function () {
    assert.is(mockLog.lastMessage, UNEXISTENT_ID +" is not a valid application ID.", "Invalid app ID message");
    assert.end();
  });
});

test.serial("Unexistent ID", async function (assert) {
  assert.plan(1);
  check(UNEXISTENT_ID, APP_1_KEY).then(function () {
    assert.fail("Should have failed");
  }).catch(function (error) {
    assert.is(error.message, UNEXISTENT_ID +" is not a valid application ID.", "Invalid app ID message");
  })
});

test.serial("Invalid key", async function (assert) {
  var INVALID_KEY = "invalid_key";
  assert.plan(1);
  check(APP_1_ID, INVALID_KEY).then(function () {
    assert.fail("Should have failed");
  }).catch(function (error) {
    assert.is(error.message, INVALID_KEY +" key is invalid for the application ID "+ APP_1_ID +".", "Invalid app key message");
  });
});

test.serial("Valid ID / key pair", async function (assert) {
  assert.plan(1);
  check(APP_1_ID, APP_1_KEY).then(function () {
    assert.pass("It works");
  }).catch(function (error) {
    assert.fail(error.message);
  });
});
