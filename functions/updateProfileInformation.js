'use strict';

const user = require('../models/user');

exports.updateProfileInformation = (_id, firstName, lastName, gender, genderHidden, age, location, occupation, short_description) =>

    new Promise((resolve, reject) => {

        user.find({_id: _id})

        .then(users => {

            if (users.length == 0) {

                reject({ status: 404, message: 'User Not Found !' });

            } else {

                return users[0];
                
            }
        })

        .then(user => {
           user.firstName = firstName;
           user.lastName = lastName;
           user.gender = gender;
           user.genderHidden = genderHidden;
           user.age = age;
           user.location = location;
           user.occupation = occupation;
           user.short_description = short_description;
           
           return user.save();
        })

        .then(resolve({ status: 200, message: 'Profile information updated succesfully !' }))

        .catch(err => reject({ status: 500, message: 'Internal Server Error !' }));

    });