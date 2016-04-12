const test = require("tape");
const HTTPHeaderCheck = require("../lib/HTTPHeaderCheck");

const req = {headers: []};
const res = {
	status(code) {
		this.code = code;
		return this;
	},
	end (object) {
		this.object = object;
	}
};

test("HTTPHeaderCheck rejects no token", assert => {
	const headerCheck = HTTPHeaderCheck();
	headerCheck(req, res);
	assert.equal(401, res.code);
	assert.end();
});

test("HTTPHeaderCheck accepts valid user token", assert => {
	assert.plan(1);

	req.headers['x-access-token'] = "token";
	const userCheck = function () { return new Promise((resolve, reject) => resolve()); };
	const headerCheck = HTTPHeaderCheck(null, userCheck);
	const next = function () { assert.pass("next invoked"); };

	headerCheck(req, res, next);
});

test("HTTPHeaderCheck rejects invalid user token", assert => {
	req.headers['x-access-token'] = "token";
	const userCheck = function () { return new Promise((resolve, reject) => reject()); };
	const headerCheck = HTTPHeaderCheck(null, userCheck);

	headerCheck(req, res);

	assert.equal(res.code, 401, "Should have failed");
	assert.end();
});

test("HTTPHeaderCheck accepts valid app id / key", assert => {
	assert.plan(1);

	req.headers['x-access-app-id'] = "id";
	req.headers['x-access-token'] = "key";
	const appCheck = function () { return new Promise((resolve, reject) => resolve()); };
	const headerCheck = HTTPHeaderCheck(appCheck);
	const next = function () { assert.pass("next inoked"); };

	headerCheck(req, res, next);
});

test("HTTPHeaderCheck rejects invalid app id / key", assert => {
	req.headers['x-access-app-id'] = "id";
	req.headers['x-access-token'] = "key";
	const appCheck = function () { return new Promise((resolve, reject) => reject()); };
	const headerCheck = HTTPHeaderCheck(appCheck);

	headerCheck(req, res);

	assert.equal(res.code, 401, "Should have failed");
	assert.end();
});
