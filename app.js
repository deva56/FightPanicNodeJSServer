'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const logger = require('morgan');
const router = express.Router();
const HTTPport = process.env.PORT || 8080;
const HTTPSport = process.env.PORT || 8443;
const http = require('http');
const https = require('https');
const { config } = require('process');
const hashmap = require('hashmap');
const socketio = require('socket.io');
const roomController = require('./Controllers/roomController');
const fs = require('fs');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));

require('./routes')(router);
app.use('/api/v1', router);

let httpServer = http.createServer(app);
httpServer.listen(HTTPport);
console.log(`HTTP Runs on ${HTTPport}`);

var io = socketio.listen(httpServer)
io.on('connection', function (socket) {

    console.log(`Socket with SocketId = ${socket.id} connected to server.`)
    var userName = '';
    const fightClubRoom = "FightClubRoom";

    socket.on('subscribeFightClubRoom', function () {
        socket.join(fightClubRoom)
    })

    socket.on('subscribe', function (data) {
        const room_data = JSON.parse(data)
        userName = room_data.username;
        const roomName = room_data.roomName;
        const isFromBackground = room_data.isFromBackground;

        socket.join(`${roomName}`)

        if (isFromBackground == false) {
            io.to(`${roomName}`).emit('newUserToChatRoom', userName);
        }

        roomController.joinRoom(roomName, userName)
            .then(result => {
                console.log(result.message)
            })
            .catch(err => {
                if (err.status == 404) {
                    io.to(socket.id).emit("roomDeleted")
                }
                console.log(err.message)
            });
    })

    socket.on('unsubscribe', function (data) {
        const room_data = JSON.parse(data)
        const roomName = room_data.roomName;

        socket.broadcast.to(`${roomName}`).emit('userLeftChatRoom', userName)
        socket.leave(`${roomName}`)
    })

    socket.on('newMessage', function (data) {

        const messageData = JSON.parse(data)
        const userName = messageData.userName
        const messageContent = messageData.messageContent
        const roomName = messageData.roomName
        const viewType = messageData.viewType
        const profilePictureURL = messageData.profilePictureURL

        const chatData = {
            userName: userName,
            messageContent: messageContent,
            roomName: roomName,
            viewType: viewType,
            profilePictureURL: profilePictureURL
        }
        socket.broadcast.to(`${roomName}`).emit('updateChat', JSON.stringify(chatData))
    })

    socket.on('userTyping', function (data) {
        const messageData = JSON.parse(data)
        const roomName = messageData.roomName
        const username = messageData.userName
        socket.broadcast.to(`${roomName}`).emit('typing', username)
    })

    socket.on('userStopTyping', function (data) {
        const messageData = JSON.parse(data)
        const roomName = messageData.roomName
        const username = messageData.userName
        socket.broadcast.to(`${roomName}`).emit('stopTyping', username)
    })

    socket.on('updateFightClubActivity', function () {
        socket.broadcast.to(fightClubRoom).emit('updateFightClubActivity')
        io.to(socket.id).emit("jumpToChat")
    })

    socket.on('leaveRoom', function (data) {
        const room_data = JSON.parse(data)
        const roomName = room_data.roomName
        const userName = room_data.username
        const leaveWarning = room_data.leaveWarning

        roomController.leaveRoom(roomName, userName, leaveWarning)
            .then(result => {
                console.log(result.message)

                if (result.status == 100) {
                    io.to(socket.id).emit("leaveRoom")
                }
                else if (result.status == 105) {
                    io.to(socket.id).emit("leaveRoomWarning")
                }
                else if (result.status == 201) {
                    io.to(socket.id).emit("leaveRoomFinal")
                    socket.broadcast.to(roomName).emit('killForegroundService')
                    socket.broadcast.to(fightClubRoom).emit('updateFightClubActivity')
                    io.to(socket.id).emit("updateFightClubActivity")
                }
                else {
                    io.to(socket.id).emit("leaveRoomFinal")
                }
            })
            .catch(err => console.log(err.message));
    })

    socket.on('deleteRoom', function (data) {
        const room_data = JSON.parse(data)
        const roomname = room_data.roomName
        const username = room_data.username

        roomController.deleteRoomWhileUserJoined(roomname, username)
            .then(result => {
                console.log(result.status + ' : ' + result.message)

                if (result.status == 201) {
                    socket.broadcast.to(fightClubRoom).emit('updateFightClubActivity')
                    io.to(socket.id).emit("updateFightClubActivity")
                }
            })
            .catch(err => console.log(err.message));
    })

    socket.on('userInactive', function (data) {
        const room_data = JSON.parse(data)
        const roomname = room_data.roomName
        const username = room_data.userName
        roomController.setUserInactive(roomname, username)
            .then(result => {
                console.log(result.status + ' : ' + result.message)
            })
            .catch(err => console.log(err.message));
    })

    socket.on('userActive', function (data) {
        const room_data = JSON.parse(data)
        const roomname = room_data.roomName
        const username = room_data.userName
        roomController.setUserActive(roomname, username)
            .then(result => {
                if (result.status == 200) {
                    io.to(socket.id).emit("userSetActive")
                }
                console.log(result.status + ' : ' + result.message)
            })
            .catch(err => {
                if (err.status == 404) {
                    io.to(socket.id).emit("roomDeleted")
                }
                console.log(err.message)
            });
    })

    socket.on('disconnect', function () {
        console.log(`Socket with SocketId : ${socket.id} disconnected from server.`)
    });
});