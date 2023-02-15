const { validationResult } = require('express-validator');

module.exports = (req) => {
	const result = validationResult(req);
	if (!result.isEmpty()) {
		throw new Error(result.array()[0].msg);
	} else {
		return req.body;
	}
};
