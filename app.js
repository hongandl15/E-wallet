const express = require('express')
const hbs = require('express-handlebars')
const session = require('express-session')
const app = express()
var path = require('path')
const port = 8080
const mongoose = require('mongoose')
const User = require('./models/user.js')
const wallet = require('./wallet.js')
const login = require('./login.js')
const register = require('./register.js')
const admin = require('./admin.js')
const user = require('./user.js')

mongoose.connect('mongodb://localhost:27017', function (err) {
    if (err) throw err;
    console.log('Successfully connected');
});

User.find(function(err, users){
    if(users.length != 0) return;
    new User({
        username: "admin",
        password: "123456",
        fullname: "Admin",
        phone: '0123456789',
        Birthdate: '',
        balance: '1000000',
        firstLogin: false,
        status: 'verified',
        role: 'admin',
    }).save();
    new User({
        username: "hongan",
        password: "123456",
        fullname: "Ân Nguyễn",
        phone: '9876543210',
        email: 'hongandl15@gmail.com',
        address: '209 Bui Thi Xuan',
        Birthdate: '08/12/2022',
        balance: '0',
        firstLogin: false,
        status: 'verified',
        role: 'user',
        wrongpw: 0,
        unusuallogin: 0,
        idCard:{
            photofrontName: "0326009123IDCardFront",
            photofrontPath: "D:\Web\E-wallet/data/photo/9876543210IDCardFront.jpg",
            photobackName: "0326009123IDCardBack",
            photobackPath: "D:\Web\E-wallet/data/photo/9876543210IDCardBack.jpg",
        }
    }).save();
})

app.engine('handlebars', hbs.engine({defaultLayout: 'main',}))
app.use(express.urlencoded())
app.use(session({ secret: 'fafsdhalj' }))
app.set('view engine', 'handlebars')
// app.use(express.static(__dirname + '/data'));
app.use(express.static(path.join(__dirname, './public')));

app.use(function(req, res, next) { // không hiển thị lại message session khi back lại trang
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

app.use('/', login)
app.use('/', user)
app.use('/', register)
app.use('/', wallet)
app.use('/', admin)


app.listen(port, () => console.log(`Express started on https:/localhost:${port};`))