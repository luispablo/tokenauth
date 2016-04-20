const test = require("tape");
const Middleware = require("../lib/Middleware");

const req = {headers: []};
const res = { status(code) { this.code = code; return this; }, end(message) { this.message = message; } };
const mockLog = { debug(msg) { this.lastMessage = msg; } };

test("Middleware - rejects request without token", assert => {
	const appCheck = function () { return new Promise((resolve, reject) => reject()); };
	const next = function () { assert.fail("Shouldn't invoke next"); };
	const middleware = Middleware(appCheck, null, [], mockLog)("/");

	middleware(req, res, next);

	assert.equal(res.code, 401, "Rejects not excluded route without token");
	assert.end();
});

test("Middleware - accepts excluded route without token", assert => {
	assert.plan(1);
	const EXCLUDED_ROUTE = "/excluded_route";
	const next = function () { assert.pass("Should call next on excluded route"); };
	const middleware = Middleware(null, null, [EXCLUDED_ROUTE], mockLog)(EXCLUDED_ROUTE);

	middleware(req, res, next);
});
