
const test = require("ava");
const initTokenauth = require("../tokenauth");
const { AuthFetch } = require("../tokenauth");
const libAuthFetch = require("../lib/AuthFetch");

test("Exports", function (assert) {
  assert.true(initTokenauth({}) !== null, "Something exported as default");
  assert.is(AuthFetch, libAuthFetch, "exports AuthFetch without invoking function");
});

test("Build router with roles in it", function (assert) {
  const config = {
    roles: {
      "role1": { groups: ["group1", "group2"], users: ["user1"] },
      "role2": { users: ["user1", "user3"] }
    }
  };
  const tokenauth = initTokenauth(config);
  const Router = tokenauth.Router(null, "secret", 90, null);
  assert.deepEqual(Router.getRoles(), config.roles, "Has the roles in it");
});
