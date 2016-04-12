const HTTP_HEADER_KEY_APP_ID = "x-access-app-id";
const HTTP_HEADER_KEY_ACCESS_TOKEN = "x-access-token";

module.exports = function (appCheck, userCheck) {
	return function(req, res, next) {
		var appId = req.headers[HTTP_HEADER_KEY_APP_ID];
		var token = req.headers[HTTP_HEADER_KEY_ACCESS_TOKEN]; // Only allow token in HTTP headers

		if (!token) return res.status(401).end("No token provided");

		if (appId) {
			appCheck(appId, token).then(() => next()).catch(error => {
				res.status(error.status).end(error.message);
			});
		} else {
			userCheck(token).then(() => next()).catch(error => {
				res.status(error.status).end(error.message);
			});
		}
	};
};
