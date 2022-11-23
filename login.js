const express = require('express')
var router = express.Router();
const User = require('./models/user.js')
const utils = require('./utils.js')
var formidable = require('formidable');
var dataDir = __dirname + '/data';
var PhotoDir = dataDir + '/photo';
var fs = require('fs')
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(PhotoDir) || fs.mkdirSync(PhotoDir);


router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.session.user
    let message = req.session.message
    User.findOne({username: us.username}, function(err, user){
        if(user != null){   
            req.session.user = user
            if(user.role == "admin"){
                return res.render('admin', {title: 'Quản trị viên', user}) 
            }
            return res.render('index', {title: 'Trang chủ', user , message: message})

        }
    }).lean()      
})

// login
router.get('/login', (req, res) => {
    var message = req.session.message;
    res.render('login', {message: message})
})

router.post('/login', function(req, res){
    let us = req.body.username
    let pw = req.body.password
    User.findOne({username: us}, function(err, user){
        if(user != null){
            var wrongpassword = user.wrongpw
            var unusuallogin = user.unusuallogin
            var time = 0
            if(user.unusuallogin == 1)
                if(time < 1)
                    return res.render('login', {layout: null, error: 'Tài khoản hiện đang bị tạm khóa, vui lòng thử lại sau 1 phút'})
            else if (user.unusuallogin >=2) 
                return res.render('login', {layout: null, error: 'Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần, vui lòng liên hệ quản trị viên để được hỗ trợ'})
                
            if(pw == user.password){        
                req.session.user = user
                if(user.firstLogin== true){
                    return res.render('firstlogin', user)
                }
                User.updateOne({username: us},
                    {$set: {wrongpw: 0, unusualogin: 0}}, function(err,user){}); 
                return res.redirect('/')   

            }else if (user.role != "admin") {
                wrongpassword+=1
                if(wrongpassword == 3 || wrongpassword == 6){
                    unusuallogin += 1
                }
                User.updateOne({username: us}, {$set: {wrongpw: wrongpassword, unusuallogin: unusuallogin} },  function(err,user){});
            }

        return res.render('login', { layout: null, error: 'Sai mật khẩu' })
            
        }
        else {
            console.log(err)
            return res.render('login', { layout: null, error: 'Sai thông tin đăng nhập' })
        }
    });
});



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
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
            if(err) return res.redirect(303, '/404');

            var photofront = files.photofront
            var photoback = files.photoback

            var photofrontName = fields.phone + 'IDCardFront'
            var photobackName = fields.phone + 'IDCardBack'

            var frontoldPath = photofront.filepath
            var frontnewPath = PhotoDir + '/' + photofrontName + ".jpg"

            var backoldPath = photoback.filepath
            var backnewPath = PhotoDir + '/' + photobackName + ".jpg"
            fs.copyFile(frontoldPath, frontnewPath, function (err) {
                if (err) throw err;
                console.log('File uploaded and moved!');
            });

            fs.copyFile(backoldPath, backnewPath, function (err) {
                if (err) throw err;
                console.log('File uploaded and moved!');
                console.log(utils.getBirthdate(fields.birthdate))
            });

            console.log(utils.getBirthdate(fields.birthdate))

            new User({
                username: utils.generate_username(9),
                password: utils.generate_password(6),
                fullname: fields.fullname,
                phone: fields.phone,
                email: fields.email,
                Birthdate: utils.getBirthdate(fields.birthdate),
                balance: 0,
                available: true,
                firstLogin: true,
                status: 'unverified',
                role: 'user',
                wrongpw: 0,
                unusuallogin: 0,
                idcard:{
                    photofrontName: photofrontName,
                    photofrontPath: frontnewPath,
                    photobackName: photobackName,
                    photobackPath: backnewPath,
                } ,
                available: true
            }).save();

        });
    req.session.message = 'Đăng kí thành công tài khoản và mật khẩu đã được gửi về email của bạn'
    return res.redirect('/')
}) 

// details user
router.get('/user', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    return res.render('details', user)
})

 //delete
router.delete('/delete/:username', (req, res) => {
    let us = req.params.username
    User.deleteOne({username: us}, function(err, users){
        if(err) throw err;
    })
    return res.render('index', {message : "da xoa thanh cong"})
})

// firstlogin
router.post('/firstlogin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    User.updateOne({username: user.username},
        {$set: {password: req.body.password, firstLogin: false} }, function(){});
    return res.redirect('/')
})



// changepassword
router.get('/changepassword', (req, res) => {
    res.render('changepassword')
})

router.post('/changepassword', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    if(user.password == req.body.password){
        if(req.body.newpassword == req.body.passwordconfirm){
            User.updateOne({username: user.username},
                {$set: {password: req.body.newpassword}}, function(err, user){
                    console.log('Đổi mật khẩu thành công') 
                });
        }
        else return res.render('changepassword', {message : "Mật khẩu không trùng khớp"})
    }
    else return res.render('changepassword', {message : "Sai mật khẩu"})

    return res.redirect('/')
    
})


module.exports = router;