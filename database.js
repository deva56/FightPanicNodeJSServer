'use strict';

const mongoose = require('mongoose'); 
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fight-panic' 

mongoose.Promise = global.Promise;
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log("DB connected to : " + DB_URI)
}).catch((err) => {
    console.log("DB failed :  " + DB_URI + " : " + err)
});

module.exports = {
    mongoose
};