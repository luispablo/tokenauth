module.exports = function (keys, log) {

	return function (id, key) {
		return new Promise(function (resolve, reject) {
			if (!keys.hasOwnProperty(id)) {
				var message1 = id +" is not a valid application ID.";
				log.debug(message1);
				reject({status: 401, message: message1});
			} else if (keys[id] !== key) {
				var message2 = key +" key is invalid for the application ID "+ id +".";
				log.debug(message2);
				reject({status: 401, message: message2});
			} else {
				resolve();
			}
		});
	};
};
