
const Router = require("../lib/Router");
const test = require("ava");
const tokensManager = require("../lib/tokensManager");

test.beforeEach(function beforeEach (t) {
  const tokens = tokensManager();
  const { addToken } = Router(tokens)(null, "key");
  t.context = { addToken, tokens };
});

test("add / exists / remove", function (t) {
  const { addToken, tokens } = t.context;
  const token = addToken("username1", { name: "User1" });
  t.falsy(tokens.exists(token), "Not added yet");
  tokens.add(token);
  t.truthy(tokens.exists(token), "Now it's there");
  tokens.remove(token);
  t.falsy(tokens.exists(token), "It's removed");
});
