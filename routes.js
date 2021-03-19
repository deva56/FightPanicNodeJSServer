'use strict';

const auth = require('basic-auth');
const jwt = require('jsonwebtoken');

const register = require('./functions/register');
const returnProfilePicture = require('./functions/returnProfilePicture.js');
const updateProfilePicture = require('./functions/updateProfilePicture');
const login = require('./functions/login');
const profile = require('./functions/profile');
const checkIfUserExists = require('./functions/checkIfUserExists');
const password = require('./functions/password');
const config = require('./config/config');
const roomController = require('./Controllers/roomController');
const updateProfileInformation = require('./functions/updateProfileInformation');

module.exports = router => {

	router.get('/', (req, res) => res.end('Welcome to FightPanic!'));

	router.get('/getIfRoomAlive/:roomName', (req, res) => {
		roomController.getIfRoomAlive(req.params.roomName)
			.then(result => res.status(result.status).json({ message: result.message }))
			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/authorizeJoinRoom/:roomName/:roomPassword', (req, res) => {
		roomController.authorizeJoinRoom(req.params.roomName, req.params.roomPassword)
			.then(result => res.status(result.status).json({ message: result.message }))
			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/rooms', (req, res) => {
		roomController.getAllRooms()
			.then(result => res.json(result))
			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/createNewRoom', (req, res) => {
		roomController.createNewRoom(req.body.admin, req.body.roomName, req.body.roomDescription, req.body.roomPrivate,
			req.body.roomPassword)
			.then(result => {
				res.json(result.newRoom)
			})
			.catch(err =>
				res.status(err.status).json({ message: err.message })
			);
	});

	router.post('/authenticate', (req, res) => {

		const credentials = auth(req);

		if (!credentials) {

			res.status(400).json({ message: 'Invalid Request !' });

		} else {

			login.loginUser(credentials.name, credentials.pass)

				.then(result => {

					const token = jwt.sign(result, config.env.secret, { expiresIn: 1440 });

					res.status(result.status).json({ message: result.message, token: token });

				})

				.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/profileImageUpdatePhoto', (req, res) => {

		updateProfilePicture.updateProfilePicture(req.body.email, req.body.profile_picture_path, req.body.profile_picture_name)
			.then(result => res.json(result))
			.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.get('/profilePicture/:email', (req, res) => {

		returnProfilePicture.returnProfilePicture(req.params.email)
			.then(result => res.download(result))
			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/updateProfileInformation', (req, res) => {
		const _id = req.body._id;
		const firstName = req.body.firstName;
		const lastName = req.body.lastName;
		const gender = req.body.gender;
		const genderHidden = req.body.genderHidden;
		const age = req.body.age;
		const location = req.body.location;
		const occupation = req.body.occupation;
		const shortDescription = req.body.short_description;

		if (!_id || !_id.trim() || !firstName || !lastName || !location || !shortDescription || !age || !gender || !genderHidden || !occupation ||
			!location.trim() || !shortDescription.trim() || !age.trim() || !gender.trim() || !genderHidden.trim() || !occupation.trim() || !firstName.trim() || !lastName.trim()) {
			res.status(400).json({ message: 'Invalid Request !' });
		}
		else {
			updateProfileInformation.updateProfileInformation(_id, firstName, lastName, gender, genderHidden, age, lastName, occupation, shortDescription)
				.then(result => res.json(result))
				.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/registerUser', (req, res) => {

		const username = req.body.username;
		const email = req.body.email;
		const password = req.body.password;
		const firstName = req.body.firstName;
		const lastName = req.body.lastName;
		const gender = req.body.gender;
		const genderHidden = req.body.genderHidden;
		const age = req.body.age;
		const location = req.body.location;
		const occupation = req.body.occupation;
		const shortDescription = req.body.short_description;
		const profile_picture_path = req.body.profile_picture_path;
		const profile_picture_name = req.body.profile_picture_name;

		if (!username || !email || !password || !firstName || !lastName || !location || !shortDescription || !age || !gender || !genderHidden || !occupation || !profile_picture_path ||
			!profile_picture_name || !location.trim() || !shortDescription.trim() || !age.trim() || !gender.trim() || !genderHidden.trim() || !occupation.trim() || !firstName.trim() || !lastName.trim() ||
			!username.trim() || !email.trim() || !password.trim() || !profile_picture_path.trim() || !profile_picture_name.trim()) {

			res.status(400).json({ message: 'Invalid Request !' });

		} else {

			register.registerUser(username, email, password, firstName, lastName, gender, genderHidden, age, location, occupation, shortDescription, profile_picture_path, profile_picture_name)
				.then(result => {

					res.setHeader('Location', '/registerUser/' + email);
					res.status(result.status).json({ message: result.message })
				})

				.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.get('/getUserEmail/:email', (req, res) => {

		checkIfUserExists.checkIfUserEmailExists(req.params.email)
			.then(result => res.json(result))
			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/getUsername/:username', (req, res) => {

		checkIfUserExists.checkIfUsernameExists(req.params.username)
			.then(result => res.json(result))
			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/getProfile/:id', (req, res) => {

		if (checkToken(req)) {

			profile.getProfile(req.params.id)

				.then(result => res.json(result))

				.catch(err => res.status(err.status).json({ message: err.message }));

		} else {

			res.status(401).json({ message: 'Invalid Token !' });
		}
	});

	router.put('/changePassword/:id', (req, res) => {

		if (checkToken(req)) {

			const oldPassword = req.body.password;
			const newPassword = req.body.newPassword;

			if (!oldPassword || !newPassword || !oldPassword.trim() || !newPassword.trim()) {

				res.status(400).json({ message: 'Invalid Request !' });

			} else {

				password.changePassword(req.params.id, oldPassword, newPassword)

					.then(result => res.status(result.status).json({ message: result.message }))

					.catch(err => res.status(err.status).json({ message: err.message }));

			}
		} else {
			res.status(401).json({ message: 'Invalid Token !' });
		}
	});

	router.post('/resetPassword/:id', (req, res) => {

		const email = req.params.id;
		const token = req.body.token;
		const newPassword = req.body.password;

		if (!token || !newPassword || !token.trim() || !newPassword.trim()) {

			password.resetPasswordInit(email)

				.then(result => res.status(result.status).json({ message: result.message }))

				.catch(err => res.status(err.status).json({ message: err.message }));

		} else {

			password.resetPasswordFinish(email, token, newPassword)

				.then(result => res.status(result.status).json({ message: result.message }))

				.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	function checkToken(req) {

		const token = req.headers['x-access-token'];

		if (token) {

			try {

				var decoded = jwt.verify(token, config.env.secret);

				return decoded.message === req.params.id;

			} catch (err) {

				return false;
			}

		} else {

			return false;
		}
	}
}
