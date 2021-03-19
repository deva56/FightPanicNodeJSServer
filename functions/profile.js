'use strict';

const user = require('../models/user');

exports.getProfile = email 	=>

	new Promise((resolve,reject) => {

		user.find({ email: email }, { username: 1, email: 1, created_at: 1, gender: 1, genderHidden: 1,  age: 1, location: 1, occupation: 1, 
			firstName: 1, lastName:1, short_description: 1 , _id: 1, profile_picture_path: 1, profile_picture_name: 1})

		.then(users => resolve(users[0]))

		.catch(err => reject({ status: 500, message: 'Internal server error!' }))

	});
