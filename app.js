const express = require('express')
const hbs = require('express-handlebars')
const api = require('./userapi')
const session = require('express-session')
const app = express()
const port = 8080
const mongoose = require('mongoose')
const User = require('./models/user.js')
const route = require('Router')

 mongoose.connect('mongodb://localhost:27017', function (err) {
  
    if (err) throw err;
  
    console.log('Successfully connected');
  
 });


 var card = {

 }


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

function generate_password(n) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < n; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

function generate_username(n) {
var text = "";
var possible = "0123456789";
for (var i = 0; i < n; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
}
return text;
}

app.engine('handlebars', hbs.engine({
    defaultLayout: 'main',
}))
app.set('view engine', 'handlebars')
app.use(express.urlencoded())
app.use(session({ secret: 'fafsdhalj' }))

app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var user = req.session.user
    return res.render('index', {title: 'trang chủ', user})
})

// deposit
app.get('/deposit/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var user1 = req.session.user
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('deposit', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

app.post('/deposit/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    console.log(cardnumber + cvv)
    console.log(req.body.money) 
    let us = req.params.username
    if (cardnumber == 111111 && cvv == 411){
        User.findOne({username: us}, function(err, user){
            if(user != null){
                console.log(us)  
                userbalance = parseInt(user.balance) + parseInt(req.body.money)
                User.updateOne({username: us},
                    {$set: {balance: userbalance} },
                     function(){   
                        console.log('done')      
                    });
            } 
        });       
    }
    console.log("failed")
    return res.redirect('/')
})
// withdraw
app.get('/withdraw/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var user1 = req.session.user
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('withdraw', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

app.post('/withdraw/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    console.log(cardnumber + cvv)
    console.log(req.body.money) 
    let us = req.params.username
    if (cardnumber == 111111 && cvv == 411){
        if(req.body.money % 50 == 0){
            User.findOne({username: us}, function(err, user){
                if(user != null){
                    console.log(us)  
                    userbalance = parseInt(user.balance) - parseInt(req.body.money)
                    User.updateOne({username: us},
                        {$set: {balance: userbalance} },
                        function(){   
                            console.log('done')      
                        });
                } 
            }); 
        }else{
            console.log('So tien rut phai la boi so cua 50')
        }    
    }
    return res.redirect('/')
})

// transfer
app.get('/transfer/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var user1 = req.session.user
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('transfer', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

app.post('/transfer/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }

    let note = req.body.note
    let money = req.body.money

    let us = req.params.username
        User.findOne({phone: req.body.phone}, function(err, user){
            if(user != null){
                receiverbalance = parseInt(user.balance) + parseInt(money)
                User.updateOne({phone: req.body.phone},
                    {$set: {balance: receiverbalance} },
                    function(){   
                        console.log('done')      
                    });      
            } 
        });
        User.findOne({username: us}, function(err, user){
            if(user != null){
                senderbalance = parseInt(user.balance) - parseInt(money)
                User.updateOne({username: us},
                    {$set: {balance: senderbalance} },
                    function(){   
                        console.log('done')      
                    });
            } 
        });
    return res.redirect('/')
})

// register
app.get('/register', (req, res) => {
    res.render('register')
})
app.post('/register', (req, res) => {
    new User({
        username: generate_username(9),
        password: generate_password(6),
        fullname: req.body.fullname,
        phone: req.body.phone,
        email: req.body.email,
        Birthdate: req.body.birthdate,
        balance: 0,
        available: true,
        firstLogin: true,
        verified: false,
        role: 'user',
        idcard: '0123456',
        available: true
    }).save();
    return res.redirect('/')
})  


// login
app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/login', function(req, res){
    let us = req.body.username
    let pw = req.body.password
    User.findOne({username: us, password: pw}, function(err, user){
        if(user != null){
            req.session.user = user
            if(user.firstLogin== true){
                return res.render('firstlogin', user)
            }
            console.log(user)
            return res.redirect('/')
        }
        else {
            console.log(err)
            return res.render('login', { layout: null, error: true })
        }
    });
});


app.get('/user/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('details', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

app.delete('/delete/:username', (req, res) => {
    let us = req.params.username
    User.deleteOne({username: us}, function(err, users){
        if(err) throw err;
        
    })
    return res.render('index', {message : "da xoa thanh cong"})
})


app.get('/update/:username', (req, res) => {
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('edit', user)
        } 
        else {
            console.log(err)
            return res.redirect('/')
        }
    });
})
// firstlogin
app.post('/firstlogin/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    User.updateOne({username: us},
        {$set: {password: req.body.password, firstLogin: false} },
         function(){  
            return res.redirect('/')
        });
})

// edit
app.post('/update/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    User.updateOne({username: us},
        {$set: {username: req.body.username, password: req.body.password, fullname: req.body.fullname} },
         function(err,user){     
            console.log(user)      
        return res.redirect('/')
    });
})


app.listen(port, () => console.log(`Express started on https:/localhost:${port};`))