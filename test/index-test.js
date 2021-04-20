var test = require("ava");
var index = require("../index");
var AuthFetch = require("../lib/AuthFetch");

test("index - exports", function (assert) {
  assert.true(index({}) !== null, "Something exported as default");
  assert.is(index.AuthFetch, AuthFetch, "exports AuthFetch without invoking function");
});

test("index - Build router with roles in it", function (assert) {
  const config = {
    roles: {
      "role1": { groups: ["group1", "group2"], users: ["user1"] },
      "role2": { users: ["user1", "user3"] }
    }
  };
  const tokenauth = index(config);
  const Router = tokenauth.Router(null, "secret", 90, null);
  assert.deepEqual(Router.getRoles(), config.roles, "Has the roles in it");
});
