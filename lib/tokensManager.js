
const fs = require("fs");
const objectEquals = require("./objectEquals");

const { DEFAULT_TOKENS_FILENAME } = require("../lib/constants");

const tokensManager = function tokensManager (filename = DEFAULT_TOKENS_FILENAME) {

  const tokens = (function init () {
    try {
      return JSON.parse(fs.readFileSync(filename, { encoding: "utf-8" }));
    } catch (err) {
      if (err.code === "ENOENT") return [];
      else throw err;
    }
  })();

  const persistTokens = () => fs.writeFileSync(filename, JSON.stringify(tokens, null, 2) + "\n", { encoding: "utf-8" });

  const exists = function exists (token) {
    return tokens.some(t => objectEquals(t, token));
  };

  const add = function add (token) {
    if (!exists(token)) {
      tokens.push(token);
      persistTokens();
    }
  };

  const clear = function clear () {
    tokens.splice(0);
    persistTokens();
  };

  const remove = function remove (token) {
    tokens.splice(tokens.indexOf(token), 1);
    persistTokens();
  };

  return {
    add,
    clear,
    exists,
    remove,
    size: () => tokens.length
  };
};

module.exports = tokensManager;
