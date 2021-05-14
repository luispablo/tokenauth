
const Router = require("../lib/Router");
const test = require("ava");
const tokensManager = require("../lib/tokensManager");

test.beforeEach(function beforeEach (t) {
  const tokens = tokensManager();
  const { addToken } = Router(tokens)(null, "key", 1);
  const token1 = addToken("username1", { name: "User1" });
  t.context = { addToken, token1, tokens };
});

test("add / exists / remove", function (t) {
  const { token1, tokens } = t.context;
  t.falsy(tokens.exists(token1), "Not added yet");
  tokens.add(token1);
  t.truthy(tokens.exists(token1), "Now it's there");
  tokens.remove(token1);
  t.falsy(tokens.exists(token1), "It's removed");
});

test("keep tokens between sessions", function (t) {
  const { addToken, token1, tokens } = t.context;
  tokens.clear();
  const tokens2 = tokensManager();
  tokens.add(token1);
  t.truthy(tokens.exists(token1), "First manager has it");
  t.falsy(tokens2.exists(token1), "2nd managers doesn't have it, as it was initialized before adding it");
  const tokens3 = tokensManager();
  t.truthy(tokens3.exists(token1), "but 3rd manager has it, as it was initialized later");
  tokens3.remove(token1);
  const tokens4 = tokensManager();
  t.false(tokens4.exists(token1));
});

test("don't store duplicates", function (t) {
  const { token1 } = t.context;
  const tokens = tokensManager();
  tokens.clear()
  tokens.add(token1);
  tokens.add(token1);
  t.is(tokens.size(), 1, "token1 added only once");
});
