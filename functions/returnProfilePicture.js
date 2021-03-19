'use strict';

const user = require('../models/user');

exports.returnProfilePicture = email =>

	new Promise((resolve,reject) => {

		user.find({ email: email }, { profile_picture_path: 1})

		.then(users => resolve(users[0].profile_picture_path))

		.catch(err => reject({ status: 500, message: 'Internal Server Error Profile Picture!' }))

	});
