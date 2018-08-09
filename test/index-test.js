var test = require("tape");
var index = require("../index");
var AuthFetch = require("../lib/AuthFetch");

test("index - exports", function (assert) {
  assert.ok(index({}) !== null, "Something exported as default");
  assert.equal(index.AuthFetch, AuthFetch, "exports AuthFetch without invoking function");
  assert.end();
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
  assert.end();
});
