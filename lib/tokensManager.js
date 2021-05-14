
const tokensManager = function tokensManager () {

  const tokens = [];

  const add = function add (token) {
    tokens.push(token);
  };

  const exists = function exists (token) {
    return tokens.indexOf(token) >= 0;
  };

  const remove = function remove (token) {
    tokens.splice(tokens.indexOf(token), 1);
  };

  return {
    add,
    exists,
    remove
  };
};

module.exports = tokensManager;
