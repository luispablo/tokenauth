
const { APPLICATION_JSON, ACCEPT, CONTENT_TYPE, X_ACCESS_TOKEN } = require("./constants");

const getJWT = function getJWT (options) {
  if (options && options.jwt) return options.jwt;
  else if (window.localStorage) {
    if (window.localStorage["JWT"]) return window.localStorage["JWT"];
    else throw Error("NO_JWT");
  } else throw Error("No localStorage available");
};

const authFetch = function authFetch (URL, options) {
  const fetchOptions = options || {};
  const isMultipart = options && options.multipart;

  const headers = fetchOptions.headers || {};
  headers[X_ACCESS_TOKEN] = getJWT(options);
  headers[ACCEPT] = headers[ACCEPT] || APPLICATION_JSON;

  if (!isMultipart) headers[CONTENT_TYPE] = APPLICATION_JSON;

  fetchOptions.headers = headers;

  if (fetchOptions.body && typeof(fetchOptions.body) === "object" && !isMultipart) {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  return fetch(URL, fetchOptions);
};

module.exports = authFetch;
