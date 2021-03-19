const { room } = require('../models/room')
const { Message, MessageType, EventType, ReadStatus } = require('../models/message');
const { genUuid } = require('../utils/utils');
const bcrypt = require('bcryptjs');

//create new room
exports.createRoom = async function (req, res) {
    //get users
    let users = req.body.users;
    // push the current user into user list
    users.push(req.user._id);
    //remove duplicate items
    let uniqueList = [...new Set(users)];
    //create room model
    let room = new Room({ users: uniqueList, admin: req.user._id });
    //check if there is room with this info
    let foundedRoom = await Room.findOne({
        admin: req.user._id,
        users: uniqueList
    }).populate("users", '_id name username avatar last_seen', {
        _id: {
            $ne: req.user._id //except the current user
        }
    }).populate("last_msg_id").populate({
        path: 'last_msg_id',
        populate: { path: 'from' }
    }).populate("admin", '_id name username avatar last_seen');

    //check : if there is no room
    if (!foundedRoom) {

        //create default message for first creation of room
        let createdMessage = new Message({ room: room._id, content: "Room created", event_type: EventType.SERVER });
        createdMessage.save();

        //set the message id to last message of the room
        room.last_msg_id = createdMessage._id;
        await room.save(async function (err) {
            if (err) {
                //if there is error during create room we throw error
                return res.status(response.STATUS_BAD_REQUEST).json(
                    response.createResponse(response.FAILED, "Failed to create room")
                );
            } else {
                //if create room was successful we get it from database and populate users,last_msg_id and admin
                let roomCreated = await Room.findOne(room._id).populate("users", '_id name username avatar last_seen', {
                    _id: {
                        $ne: req.user._id //except current user
                    }
                }).populate("last_msg_id").populate("admin", '_id name username avatar last_seen');

                //if we get data we return to user
                if (roomCreated) {
                    return res.status(response.STATUS_OK).json(
                        response.createResponse(response.SUCCESS, "Success", { room: roomCreated })
                    );
                } else { // and if there is error to get data we return it with error
                    return res.status(response.STATUS_OK).json(
                        response.createResponse(response.SUCCESS, "Room created but failed to get data")
                    );
                }

            }
        })
    } else {
        //check : in there is a room return the exiting room
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "already exist", { room: foundedRoom })
        );
    }


};

//get all users room
exports.getRooms = async function (req, res) {
    try {
        //get room from database
        let foundedRoom = await Room.find({ "users": { "$in": req.user._id } }).populate("users", '_id name username avatar last_seen', {
            _id: {
                $ne: req.user._id //except the current user
            }
        }).populate("last_msg_id").populate({
            //we need to know that who is the sender of the last message and we need to populate it
            path: 'last_msg_id',
            populate: { path: 'from' }
        }).populate("admin", '_id name username avatar last_seen');
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "Success", { rooms: foundedRoom }, foundedRoom.length)
        );
    } catch (e) {
        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, e)
        );
    }
};

//get single room
exports.getRoom = async function (req, res) {
    try {
        //get id from parameters
        let id = req.params.room;

        /*we call this function when user open a room ,so that mean user seen the message and we need to update all of the
        message in this room and set to seen*/
        await Message.updateMany({ room: id }, { read_status: ReadStatus.READ }, { multi: true });

        //get room and populate
        let foundedRoom = await Room.findById(id).populate("users", '_id name username avatar last_seen', {
            _id: {
                $ne: req.user._id //except the current user
            }
        }).populate("last_msg_id").populate({
            path: 'last_msg_id',
            populate: { path: 'from' }
        }).populate("admin", '_id name username avatar last_seen');

        //get all message from this room
        let roomMessages = await Message.find({ room: foundedRoom.id })
            .populate('from', '_id name username avatar last_seen')

        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "Success", {
                room: foundedRoom,
                messages: roomMessages
            }, foundedRoom.length)
        );

    } catch (e) {
        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, e)
        );
    }
};


exports.joinRoom = (roomName, userName) =>

    new Promise((resolve, reject) => {

        room.find({ roomName: roomName })

            .then(rooms => {

                if (rooms.length == 0) {
                    reject({ status: 404, message: 'No room found!' });

                }
                else {
                    let room = rooms[0]
                    let roomUsers = room.users
                    let n = roomUsers.includes(userName)
                    if (!n) {
                        roomUsers.push(userName)
                        return room.save();
                    }
                    else {
                        reject({ status: 401, message: 'User already in array !' });
                    }
                }
            })

            .then(() => resolve({ status: 200, message: 'User ' + userName + ' added to room list!' }))
            .catch(err => reject({ status: 500, message: err.message }));
    });


exports.leaveRoom = (roomName, userName, leaveWarning) =>

    new Promise((resolve, reject) => {

        room.find({ roomName: roomName })

            .then(rooms => {
                let room1 = rooms[0]
                let roomUsers = room1.users
                if (roomUsers.length == 1) {
                    resolve({ status: 100, message: 'Room ' + roomName + ' is going to be deleted.' })
                }
                else {
                    if (leaveWarning == false) {
                        if (room1.inactiveUsers.length == roomUsers.length - 1) {
                            room.deleteOne({ roomName: roomName }, function (err, result) {
                                if (err) {
                                    reject({ status: 500, message: err.message })
                                } else {
                                    resolve({ status: 201, message: 'Room ' + roomName + ' deleted Sucessfully !' })
                                }
                            });
                        }
                        else {
                            const n = roomUsers.indexOf(userName)
                            roomUsers.splice(n, 1)
                            room1.save()
                            resolve({ status: 200, message: 'User ' + userName + ' removed from room list!' })
                        }
                    }
                    else {
                        resolve({ status: 105, message: "Warning for leaving room triggered." })
                    }
                }
            })
            .catch(err => reject({ status: 500, message: 'Internal server error!' }))
    });

exports.deleteRoomWhileUserJoined = (roomName, userName) =>

    new Promise((resolve, reject) => {

        room.find({ roomName: roomName })

            .then(rooms => {
                let room1 = rooms[0]
                let roomUsers = room1.users
                if (roomUsers.length == 1) {
                    room.deleteOne({ roomName: roomName }, function (err, result) {
                        if (err) {
                            reject({ status: 500, message: err.message })
                        } else {
                            resolve({ status: 201, message: 'Room ' + roomName + ' deleted Sucessfully !' })
                        }
                    });
                }
                else {
                    const n = roomUsers.indexOf(userName)
                    roomUsers.splice(n, 1)
                    room1.save()
                    resolve({ status: 200, message: 'User ' + userName + ' removed from room list!' })
                }
            })
            .catch(err => reject({ status: 500, message: 'Internal server error!' }))

    });


exports.getAllRooms = () =>
    new Promise((resolve, reject) => {
        room.find({})
            .then(rooms => resolve(rooms))
            .catch(err => reject({ status: 500, message: err.message }))
    });


exports.createNewRoom = (admin, roomName, roomDescription, roomPrivate, roomPassword) =>
    new Promise((resolve, reject) => {

        room.find({ roomName: roomName })

            .then(rooms => {
                if (rooms.length == 0) {

                    let uniqueCode = genUuid();
                    let users = [admin];

                    let salt = bcrypt.genSaltSync(10);
                    let hash = bcrypt.hashSync(roomPassword, salt);

                    let newRoom = new room({
                        code: uniqueCode,
                        admin: admin,
                        roomName: roomName,
                        roomDescription: roomDescription,
                        roomPrivate: roomPrivate,
                        roomPassword: hash,
                        users: users
                    });

                    newRoom.save()

                        .then(() => resolve({ status: 201, message: 'Room created Sucessfully !', newRoom }))
                        .catch(err => {

                            if (err.code == 11000) {

                                reject({ status: 409, message: 'Room already there !' });

                            } else {

                                reject({ status: 500, message: 'Internal Server Error !' + err.message });
                            }
                        });

                } else {

                    reject({ status: 409, message: 'Room with same name already exists !' });

                }
            })
    });

exports.authorizeJoinRoom = (roomName, roomPassword) =>

    new Promise((resolve, reject) => {

        room.find({ roomName: roomName })

            .then(rooms => {

                let room = rooms[0]
                let roomHashedPassword = room.roomPassword

                if (bcrypt.compareSync(roomPassword, roomHashedPassword)) {

                    resolve({ status: 200, message: "Room password ok." });

                } else {

                    reject({ status: 401, message: "Invalid room password !" });
                }
            })

            .catch(err => reject({ status: 500, message: err.message }));
    });


exports.setUserInactive = (roomname, username) =>

    new Promise((resolve, reject) => {

        room.find({ roomName: roomname })
            .then(rooms => {

                if (rooms.length == 0) {

                    reject({ status: 404, message: 'Room Not Found !' });

                } else {

                    return rooms[0];

                }
            })

            .then(room => {

                let roomInactiveUsers = room.inactiveUsers
                let n = roomInactiveUsers.includes(username)
                if (!n) {
                    roomInactiveUsers.push(username)
                    return room.save();
                }
                else {
                    reject({ status: 401, message: 'User already in array !' });
                }
            })
            .then(() => resolve({ status: 200, message: 'User ' + username + ' marked inactive!' }))
            .catch(err => reject({ status: 500, message: err.message }));
    });

exports.setUserActive = (roomname, username) =>

    new Promise((resolve, reject) => {

        room.find({ roomName: roomname })
            .then(rooms => {

                if (rooms.length == 0) {

                    reject({ status: 404, message: 'Room Not Found !' });

                } else {

                    return rooms[0];

                }
            })

            .then(room => {

                let roomInactiveUsers = room.inactiveUsers
                let n = roomInactiveUsers.includes(username)
                if (n) {
                    const x = roomInactiveUsers.indexOf(username)
                    roomInactiveUsers.splice(x, 1)
                    return room.save();
                }
                else {
                    reject({ status: 401, message: 'User is not in array !' });
                }
            })
            .then(() => resolve({ status: 200, message: 'User ' + username + ' marked active!' }))
            .catch(err => reject({ status: 500, message: err.message }));
    });

exports.getIfRoomAlive = (roomName) =>
    new Promise((resolve, reject) => {
        room.find({ roomName: roomName })
            .then(rooms => {
                if (rooms.length == 0) {
                    resolve({ status: 404, message: "No room with that name." });
                }
                else {
                    resolve({ status: 200, message: "Room alive." });
                }
            })
            .catch(err => reject({ status: 500, message: err.message }))
    });