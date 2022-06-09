
const addDays = require("date-fns/add_days");
const jwt = require("jwt-simple");
const subDays = require("date-fns/sub_days");
const test = require("ava");
const tokensManager = require("../lib/tokensManager");
const UserCheck = require("../lib/UserCheck");

const SECRET = "secret";
const USERNAME_1 = "username1";
const USERNAME_2 = "username2";

const exp = addDays(new Date(), 7).getTime() / 1000; // 7 days from today
const DECODED_TOKEN_1 = {iss: USERNAME_1, exp };
const TOKEN_1 = jwt.encode(DECODED_TOKEN_1, SECRET);
const TOKEN_2 = jwt.encode({iss: USERNAME_2, exp }, SECRET);
const INVALID_TOKEN = "invalid_token";

const mockLog = { debug: function (msg) { this.lastMessge = msg; } };
const tokens = tokensManager();
tokens.add(TOKEN_1);
tokens.add(TOKEN_2);
const check = UserCheck(tokens, SECRET, mockLog);

test.cb("Is logging", function (t) {
  check(INVALID_TOKEN).catch(function () {
    t.is(mockLog.lastMessge, "Invalid token", "Logged debug message");
    t.end();
  });
});

test.serial("Invalid token", async function (t) {
  t.plan(1);

  check(INVALID_TOKEN).then(function () {
    t.fail("Should have failed");
  }).catch(function (error) {
    t.is(error.message, "Invalid token", "Invalid token message");
  });
});

test.serial("Expired token", async function (t) {
  t.plan(1);

  const yesterdayInSeconds = subDays(new Date(), 1).getTime() / 1000;
  const expiredToken = jwt.encode({ sub: USERNAME_1, exp: yesterdayInSeconds }, SECRET);
  const tokens1 = tokensManager();
  tokens1.add(expiredToken)
  const expiredCheck = UserCheck(tokens1, SECRET, mockLog);

  expiredCheck(expiredToken).then(function () {
    t.fail("Should have failed");
  }).catch(function (error) {
    t.is(error.message, "Token expired", "Token expired message");
  })
});

test.serial("No valid tokens", async function (t) {
  t.plan(1);
  const tokens1 = tokensManager();
  tokens1.clear();
  const emptyCheck = UserCheck(tokens1, SECRET, mockLog);

  emptyCheck(TOKEN_1).then(function () {
    t.fail("Should have failed");
  }).catch(function (error) {
    t.is(error.message, "Invalid token", "Invalid token message");
  });
});

test.serial("Valid token", async function (t) {
  t.plan(1);

  check(TOKEN_1).then(function () {
    t.pass("Token valid");
  }).catch(function (error) {
    t.fail(error.message);
  });
});

test.cb("Resolve with decoded token", function (t) {
  check(TOKEN_1).then(function (decodedToken) {
    t.deepEqual(decodedToken, DECODED_TOKEN_1);
    t.end();
  });
});
