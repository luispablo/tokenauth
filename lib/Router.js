const moment = require("moment");
const jwt = require("jwt-simple");

const HTTP_TOKEN_HEADER = "x-access-token";

module.exports = function (authenticator, secret, validDays) {
	const tokens = [];

	function createToken (req, res) {
		const username = req.body.username;
		const password = req.body.password;

		if (username && password) {
			authenticator.authenticate(username, password).then(() => {
				const expires = moment().add(validDays, "days").valueOf();
				const token = jwt.encode({iss: username, exp: expires}, secret);

				// Store for future validation
				tokens.push(token);

				res.json({token: token, expires: expires, user: {username: username}});
			}).catch(err => res.status(err.code || 500).json(err));
		} else {
			res.status(422).end();
		}
	}

	function validateToken (req, res) {
		const token = req.headers[HTTP_TOKEN_HEADER];

		if (token && tokens.indexOf(token) >= 0) {
			const decodedToken = jwt.decode(token, secret);

			if (decodedToken.exp > Date.now()) res.status(200).end();
			else res.status(401).send("Token expired");
		} else {
			res.status(401).send("Nonexistent token");
		}
	}

	return {
		createToken, validateToken
	};
};
