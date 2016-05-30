require("es6-promise").polyfill();
require("isomorphic-fetch");

module.exports = function (jwt, fetchMock) {

	var APPLICATION_JSON = "application/json";
	var fetcher = fetchMock || fetch; // eslint-disable-line no-undef

	return function (URL, options) {
		var fetchOptions = options || {};

		var headers = fetchOptions.headers || {};
		headers["x-access-token"] = jwt.token;
		headers["Accept"] = APPLICATION_JSON;
		headers["Content-Type"] = APPLICATION_JSON;

		fetchOptions.headers = headers;

		if (fetchOptions.body && typeof(fetchOptions.body) === "object") {
			fetchOptions.body = JSON.stringify(fetchOptions.body);
		}

		return fetcher(URL, fetchOptions);
	};
};
