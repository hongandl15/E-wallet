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
    status: String,
    role: String,
    wrongpw: Number,
    unusuallogin: Number,
    idcard: {
        photofrontName: String,
        photofrontPath: String,
        photobackName: String,
        photobackPath: String,
    }
});

var User = mongoose.model('user', userSchema);
module.exports = User;