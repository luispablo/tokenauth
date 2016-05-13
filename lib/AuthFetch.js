require("es6-promise").polyfill();
require("isomorphic-fetch");

module.exports = function (jwt, fetchMock) {

	var fetcher = fetchMock || fetch; // eslint-disable-line no-undef

	return function (URL, options) {
		var fetchOptions = options || {};
		var headers = fetchOptions.headers || {};
		headers["x-access-token"] = jwt.token;
		fetchOptions.headers = headers;

		return fetcher(URL, fetchOptions);
	};
};
