'use strict';

const user = require('../models/user');
const bcrypt = require('bcryptjs');
const {genUuid} = require('../utils/utils')

exports.registerUser = (username, email, password, firstName, lastName, gender, genderHidden, age, location, 
	occupation, short_description, profile_picture_path, profile_picture_name) =>

	new Promise((resolve,reject) => {

	    const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);
		let secret_key = genUuid();

		const newUser = new user({

			username: username,
			email: email,
			created_at: new Date(),
			hashed_password: hash,
			firstName: firstName,
			lastName: lastName,
			gender: gender,
			genderHidden: genderHidden,
			age: age,
			location: location,
			occupation: occupation,
			short_description: short_description,
			profile_picture_path: profile_picture_path,
			profile_picture_name: profile_picture_name,
			secret_key: secret_key
		
		});

		newUser.save()

		.then(() => resolve({ status: 201, message: 'User Registered Sucessfully !' }))

		.catch(err => {

			if (err.code == 11000) {
				
				reject({ status: 409, message: 'User Already Registered !' });

			} else {

				reject({ status: 500, message: 'Internal Server Error !' });
			}
		});
	});
