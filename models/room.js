'use strict';

const { boolean, bool } = require('joi');
const {mongoose} = require('../database');
const Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let ChatType = {
    PERSONAL: 0,
    GROUP: 1,
    BROADCAST: 2
};


let RoomSchema = new Schema({
    code: {type: String, trim: true, unique: true},
    users: [{type: String}],
    inactiveUsers: [{type: String}],
    last_msg_id: {type: String, default:null},
    type: {type: Number, default: ChatType.GROUP},
    admin: {type: String},
    deleted: {type: Boolean, default: false},
    updated_at: {type: Number, required: true, default: new Date().getTime()},
    created_at: {type: Number, required: true, default: new Date().getTime()},
    roomName: {type: String, required: true, unique: true},
    roomDescription: {type: String, required: true},
    roomPrivate: {type: Boolean},
    roomPassword: {type: String, default:null}
});


let room = mongoose.model('room', RoomSchema);
module.exports = {room, ChatType};
