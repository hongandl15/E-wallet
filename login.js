const express = require('express')
var router = express.Router();
const User = require('./models/user.js')
const utils = require('./utils.js')

router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.session.user
    User.findOne({username: us.username}, function(err, user){
        if(user != null){
            if(user.role == "admin")
                return res.render('admin', {title: 'Quản trị viên', user}) 
            return res.render('index', {title: 'trang chủ', user}) 
        }
        
    }).lean()
})

// login
router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', function(req, res){
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

router.get('/login', (req, res) => {
    res.render('login')
})

// logout
router.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/')
})

// register
router.get('/register', (req, res) => {
    res.render('register')
})
router.post('/register', (req, res) => {
    new User({
        username: utils.generate_username(9),
        password: utils.generate_password(6),
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

// details user
router.get('/user/:username', (req, res) => {
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
 //delete
router.delete('/delete/:username', (req, res) => {
    let us = req.params.username
    User.deleteOne({username: us}, function(err, users){
        if(err) throw err;
        
    })
    return res.render('index', {message : "da xoa thanh cong"})
})


router.get('/update/:username', (req, res) => {
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            return res.render('edit', user)
        } 
        else {
            console.log(err)
            return res.redirect('/')
        }
    });
})
// firstlogin
router.post('/firstlogin/:username', (req, res) => {
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
router.post('/update/:username', (req, res) => {
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


module.exports = router;