'use strict';

const user = require('../models/user');

exports.updateProfilePicture = (email, profile_picture_path, profile_picture_name) =>

    new Promise((resolve,reject) => {

        user.find({email: email})

        .then(users => {

            if (users.length == 0) {

                reject({ status: 404, message: 'User Not Found !' });

            } else {

                return users[0];
                
            }
        })

        .then(user => {
           
            user.profile_picture_path = profile_picture_path;
            user.profile_picture_name = profile_picture_name;
            return user.save(); 

        })

        .then(user => resolve({ status: 200, message: 'Profile picture info updated successfuly !' }))

        .catch(err => reject({ status: 500, message: 'Internal Server Error !' }));
        
    });