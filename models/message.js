'use strict';

const {mongoose} = require('../database');

const Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

const MessageType = {
    TEXT: 0,
    PICTURE: 1,
    AUDIO: 2,
    VIDEO: 3,
};

const EventType = {
    MESSAGE: 0,
    JOIN: 1,
    SERVER: 2,
    TYPING: 3
};

const ReadStatus = {
    FAILED: 0,
    SENT: 1,
    READ: 2,
};

let messageSchema = new Schema({
    index: {type: String, unique: true},
    from: {type: ObjectId, ref: "User", default: null},
    room: {type: ObjectId, ref: "Room", default: null},
    content: {type: String, trim: true, default: '(empty)'},
    content_type: {type: Number, required: true, default: MessageType.TEXT},
    event_type: {type: Number, required: true, default: EventType.MESSAGE},
    read_status: {type: Number, required: true, default: ReadStatus.SENT},
    updated_at: {type: Number, required: true, default: new Date().getTime()},
    created_at: {type: Number, required: true, default: new Date().getTime()}
});


let Message = mongoose.model('Message', messageSchema);

module.exports = {Message, MessageType, EventType, ReadStatus};
