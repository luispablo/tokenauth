
const authFetch = require("../lib/authFetch");
const fetch = require("node-fetch");
const test = require("ava");

const { X_ACCESS_TOKEN } = require("../lib/constants");

global.window = {
  localStorage: {}
};

test.serial("Throw error when no JWT in local storage", async function (t) {
  try {
    await authFetch("nosite.com");
  } catch (err) {
    t.is(err.message, "NO_JWT");
  }
})

test.serial("Get JWT from options", async function (t) {
  let _headers;
  global.fetch = (_, { headers }) => { _headers = headers; return "response" };
  const res = await authFetch("nosite.com", { jwt: "token" });
  t.is(res, "response");
  t.is(_headers[X_ACCESS_TOKEN], "token");
});

test.serial("Get JWT from local storage", function (t) {
  global.window.localStorage["JWT"] = "000x5_jwt";
  let _headers;
  global.fetch = (_, { headers }) => _headers = headers;
  authFetch("nosite.com");
  t.is(_headers[X_ACCESS_TOKEN], "000x5_jwt");
});

test.serial("Throw error on HTTP response errors status codes (400 to 599)", async function (t) {
  let res1;
  try {
    global.fetch = fetch;
    res1 = await authFetch("https://clarin.com/not_exists_this", { jwt: "token" });
    await authFetch("https://clarin.com/not_exists_this", { jwt: "token", throwHTTPErrorCodes: true });
    t.fail("Shouldn't get here");
  } catch (errorRes) {
    t.is(res1.status, 404);
    t.is(errorRes.status, 404);
  }
});
