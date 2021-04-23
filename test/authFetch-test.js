
const test = require("ava");
const authFetch = require("../lib/authFetch");

const { X_ACCESS_TOKEN } = require("../lib/constants");

global.window = {
  localStorage: {}
};

test("Throw error when no JWT in local storage", function (t) {
  const error = t.throws(() => authFetch("nosite.com"));
  t.is(error.message, "NO_JWT");
})

test("Get JWT from options", function (t) {
  let _headers;
  global.fetch = (_, { headers }) => { _headers = headers; return "response" };
  const res = authFetch("nosite.com", { jwt: "token" });
  t.is(res, "response");
  t.is(_headers[X_ACCESS_TOKEN], "token");
});

test("Get JWT from local storage", function (t) {
  global.window.localStorage["JWT"] = "000x5_jwt";
  let _headers;
  global.fetch = (_, { headers }) => _headers = headers;
  authFetch("nosite.com");
  t.is(_headers[X_ACCESS_TOKEN], "000x5_jwt");
});
