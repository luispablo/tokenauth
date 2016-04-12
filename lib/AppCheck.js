module.exports = function (keys) {

	return function (id, key) {
		return new Promise((resolve, reject) => {
			if (!keys.hasOwnProperty(id)) {
				reject({status: 401, message: "Invalid App ID"});
			} else if (keys[id] !== key) {
				reject({status: 401, message: `Invalid key for App ID ${id}`});
			} else {
				resolve();
			}
		});
	};
};
