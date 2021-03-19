'use strict';

const {mongoose} = require('../database');

const Schema = mongoose.Schema;

const userSchema = Schema({

	username: {type: String, required: true, trim: true, unique: true, minlength: 3, maxlength: 30},
	email: {type: String, required: true, unique: true, trim: true},
	created_at: {type: String, required: true, trim: true},
	hashed_password: {type: String, required: true, trim: true},
	firstName: {type: String, trim: true},
	lastName: {type: String, trim: true},
	gender:	{type: String, trim: true},
	genderHidden: {type: String, trim: true},
	age:	{type: String, trim: true},
	location:	{type: String, trim: true},
	occupation:	{type: String, trim: true},
	short_description: {type: String, trim: true},
	temp_password: {type: String, trim: true},
	temp_password_time: {type: String, trim: true},
	profile_picture_path: {type: String, required: true, trim: true, unique: true},
	profile_picture_name: {type: String, required: true, trim: true, unique: true},
	isActive: {type: Boolean},
    secret_key: {type: String, trim: true},
	last_seen: {type: Number, required: true, default: new Date().getTime(), trim: true},
    updated_at: {type: Number, required: true, default: new Date().getTime(), trim: true}
});

module.exports = mongoose.model('user', userSchema);
