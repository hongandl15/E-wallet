const mongoose = require('mongoose')


var userSchema = mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    phone: String,
    email: String,
    Birthdate: Date,
    balance: Number,
    available: Boolean,
    firstLogin: Boolean,
    verified: Boolean,
    role: String,
    idcard: String,
});

var User = mongoose.model('user', userSchema);
module.exports = User;