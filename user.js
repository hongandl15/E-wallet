const express = require('express');
const session = require('express-session');
var router = express.Router();
const User = require('./models/user.js')
const utils = require('./utils.js')
const nodemailer =  require('nodemailer');
var formidable = require('formidable');
var dataDir = __dirname + '/data';
var PhotoDir = dataDir + '/photo';
var fs = require('fs')
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(PhotoDir) || fs.mkdirSync(PhotoDir);

// details user - Xem thông tin cá nhân
router.get('/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin) return res.render('./Account/firstlogin', user)  
    let user = req.session.user
    return res.render('./Account/details', {title: 'Thông tin cá nhân', ...user})
})

// Bổ sung thông tin CMND
router.post('/addID', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin) return res.render('./Account/firstlogin') 
    var form = new formidable.IncomingForm();
    let user = req.session.user
    form.parse(req, function(err, fields, files){
            if(err) return res.redirect(303, '/404');

            var photofrontName = user.phone + 'IDCardFront' // Tạo tên cho ảnh CMND mặt trước = SĐT + IDCardFront
            var photobackName = user.phone + 'IDCardBack'// Tạo tên cho ảnh CMND mặt sau = SĐT + IDCardBack

            // Thiết lập nơi chứa file ảnh và 
            var frontoldPath = files.photofront.filepath
            var frontnewPath = PhotoDir + '/' + photofrontName + ".jpg" 

            var backoldPath = files.photoback.filepath
            var backnewPath = PhotoDir + '/' + photobackName + ".jpg"
            fs.copyFile(frontoldPath, frontnewPath, function (err) { //Di chuyển file ảnh CMND mặt trước
                if (err) throw err;
            });
            fs.copyFile(backoldPath, backnewPath, function (err) { //Di chuyển file ảnh CMND mặt sau
                if (err) throw err;
            });
            User.updateOne({username: user.username}, {$set: {
                idcard:{
                    photofrontName: photofrontName,
                    photofrontPath: frontnewPath,
                    photobackName: photobackName,
                    photobackPath: backnewPath,
                }
            }}, function(){});
    });
    req.session.message = 'Cập nhật ảnh CMND thành công'
    return res.redirect('/')
}) 

// changepassword - Chức năng đổi mật khẩu
router.get('/changepassword', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin) return res.render('./Account/firstlogin') 
    res.render('./Account/changepassword', {title:'Cập nhật mật khẩu'})
})

router.post('/changepassword', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin) return res.render('./Account/firstlogin') 

    let user = req.session.user
    if(user.password == req.body.password){
        if(req.body.newpassword == req.body.passwordconfirm){
            User.updateOne({username: user.username},
                {$set: {password: req.body.newpassword}}, function(err, user){
                    console.log('Đổi mật khẩu thành công') 
                });
        }
        else return res.render('./Account/changepassword', {title:'Cập nhật mật khẩu', message : "Mật khẩu không trùng khớp"})
    }
    else return res.render('./Account/changepassword', {title:'Cập nhật mật khẩu', message : "Sai mật khẩu"})

    return res.redirect('/')
    
})

// recovery - Chức năng khôi phục mật khẩu
router.get('/recovery', (req, res) => {
    res.render('./Account/recovery', {layout: 'main-login', title: 'Khôi phục mật khẩu'})
});

router.post('/recovery', (req, res) => { // Khôi phục mật khẩu qua email
    var recovery = utils.generate_password(5) // Khởi tạo mã recovery code khôi phục
    req.session.recovery = recovery
    req.session.email = req.body.email
    var transporter =  nodemailer.createTransport({ // config mail server
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'ezbwallet@gmail.com', //Tài khoản gmail 
            pass: 'wnbohmfbxzqnjtqn' //Mật khẩu tài khoản gmail
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    var content = `
            <div style="padding: 10px; background-color: white;">
                <h4 style="color: #0085ff">Email khôi phục mật khẩu</h4>
                <span style="color: black">Đây là mã khôi phục mật khẩu của bạn</span>
                <p style="color: black">username: ` + recovery + `</p>
            </div>
    `;
    var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
        from: 'EZB Wallet',
        to: req.body.email,
        subject: 'Email khôi phục mật khẩu',
        html: content //Nội dung html
    }
    transporter.sendMail(mainOptions, function(err, info){ // gửi mail
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            console.log('Gửi mail thành công');
            res.redirect('/');
        }
    });
    return res.render('./Account/recoverycode', {layout: 'main-login', title: 'Mã xác thực'})
});

router.post('/recoverypassword', (req, res) => { // Kiểm tra mã xác thực 
    if(req.body.otp == req.session.recovery)
        return res.render('./Account/recoverypassword', {layout: 'main-login', title:'Khôi phục mật khẩu'}) 
    else {
        res.render('./Account/recoverycode', {layout: 'main-login', title:'Khôi phục mật khẩu', error : "Sai mã xác thực"})
    }
});

router.post('/successful', (req, res) => { // Chuyển đến trang nhập đổi mật khẩu mới 
    if(req.body.newpassword == req.body.passwordconfirm){
        User.updateOne({email: req.session.email}, {$set: {password: req.body.newpassword}}, function(){});
        req.session.loginsuccess = 'Khôi phục mật khẩu thành công, vui lòng đăng nhập để sử dụng dịch vụ'
    }
    else return res.render('./Account/recoverypassword', {layout: 'main-login', title:'Khôi phục mật khẩu', error : "Mật khẩu không trùng khớp"})
    return res.redirect('/')
});
    
module.exports = router;