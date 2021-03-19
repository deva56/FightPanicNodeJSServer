'use strict';

const user = require('../models/user');
let messageOfResult = "";

exports.checkIfUserEmailExists = email =>

	new Promise((resolve,reject) => {

		user.find({email: email})
		.then(users => {

			if (users.length == 0) {

				console.log("Email ok.");
				resolve({ status: 200, message: "Email ok."});

			} else {

				console.log('User with same email already exists !');
				resolve({ status: 400, message: 'User with same email already exists !'});
			}
		})
		.catch(err => reject({ status: 500, message: 'Internal Server Error !' }));
	});

  exports.checkIfUsernameExists = username =>

  	new Promise((resolve,reject) => {

      user.find({username: username})
      .then(users => {

  			if (users.length == 0) {

					console.log("Username ok.");
					resolve({ status: 200, message: "Username ok."});

  			} else {

					console.log('User with same username already exists !');
					resolve({ status: 400, message: 'User with same username already exists !'});

  			}
  		})
			.catch(err => reject({ status: 500, message: 'Internal Server Error !' }));
    });
