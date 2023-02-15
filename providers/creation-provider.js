const crypto = require('crypto');

exports.validateCreation = async (body) => {
	if (body.username.length < 3) {
		throw new Error('username too short');
	}
	if (body.password == body.confirmpassword) {
		throw new Error('confirm password does not match');
	} else {
		let password = await crypto.createHash('md5').update(body.password).digest('hex');
		body.password = password;
		return body;
	}
};
