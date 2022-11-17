const express = require('express')
const hbs = require('express-handlebars')
const session = require('express-session')
const app = express()
const port = 8080
const mongoose = require('mongoose')
const User = require('./models/user.js')
const wallet = require('./wallet.js')
const login = require('./login.js')
const admin = require('./admin.js')
var formidable = require('formidable');
var dataDir = __dirname + '/data';
var PhotoDir = dataDir + '/photo';
var fs = require('fs')
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(PhotoDir) || fs.mkdirSync(PhotoDir);


mongoose.connect('mongodb://localhost:27017', function (err) {

if (err) throw err;

console.log('Successfully connected');

});

User.find(function(err, users){
    if(users.length) return;
    new User({
        username: "admin",
        password: "123456",
        fullname: "Ân Nguyễn",
        phone: '0123456789',
        email: 'hongandl15@gmail.com',
        Birthdate: '',
        balance: '100000',
        available: true,
        firstLogin: false,
        verified: true,
        role: 'admin',
        idcard: '',
    }).save();
})

app.engine('handlebars', hbs.engine({defaultLayout: 'main',}))
app.set('view engine', 'handlebars')
app.use(express.urlencoded())
app.use(session({ secret: 'fafsdhalj' }))
app.set('view engine', 'handlebars')
app.use(express.static(__dirname + '/data'));
app.use(require('body-parser')());

app.use('/', login)
app.use('/', wallet)
app.use('/', admin)

app.listen(port, () => console.log(`Express started on https:/localhost:${port};`))