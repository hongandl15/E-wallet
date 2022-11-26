const express = require('express');
const session = require('express-session');
var router = express.Router();
const User = require('./models/user.js')
const utils = require('./utils.js')
const nodemailer =  require('nodemailer');

// home
router.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    let us = req.session.user
    let message = req.session.message
    User.findOne({username: us.username}, function(err, user){
        if(user != null){   
            req.session.user = user
            if(user.role == "admin"){
                return res.render('./Admin/admin', {title: 'Quản trị viên', user}) 
            }
            return res.render('./Home/index', {title: 'Trang chủ', user , message: message})

        }
    }).lean()      
})

// login
router.get('/login', (req, res) => {
    var message = req.session.message;
    res.render('./Account/login', {message: message})
})

router.post('/login', function(req, res){
    let us = req.body.username
    let pw = req.body.password
    User.findOne({username: us}, function(err, user){
        if(user != null){
            var wrongpassword = user.wrongpw
            var unusuallogin = user.unusuallogin
            var time = user.unusuallogintime
            if(user.unusuallogin == 1){ // Tạm khóa tài khoản khi sai mật khẩu 3 lần
                if(time == utils.getTime(new Date))
                    return res.render('./Account/login', {error: 'Tài khoản hiện đang bị tạm khóa, vui lòng thử lại sau 1 phút'})
            }
            else if (user.unusuallogin >=2)  // Khóa tài khoản khi sai mật khẩu quá nhiều lần
                return res.render('./Account/login', {error: 'Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần, vui lòng liên hệ quản trị viên để được hỗ trợ'})
                
            if(pw == user.password){        
                req.session.user = user
                if(user.firstLogin== true){
                    return res.render('./Account/firstlogin', user)
                }
                User.updateOne({username: us},
                    {$set: {wrongpw: 0, unusuallogin: 0}}, function(err,user){}); 
                return res.redirect('/')   

            }else if (user.role != "admin") {
                wrongpassword+=1
                if(wrongpassword == 3 || wrongpassword == 6){
                    unusuallogin += 1
                    var unusuallogintime = utils.getTime(new Date)
                }
                User.updateOne({username: us}, {$set: {wrongpw: wrongpassword, unusuallogin: unusuallogin, unusuallogintime: unusuallogintime} },  function(err,user){});
            }

        return res.render('./Account/login', { layout: null, error: 'Sai mật khẩu', username: us })
            
        }
        else {
            console.log(err)
            return res.render('./Account/login', { layout: null, error: 'Sai thông tin đăng nhập' })
        }
    });
});


// logout
router.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/')
})


// details user
router.get('/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    let user = req.session.user
    return res.render('./Account/details', user)
})

// firstlogin
router.post('/firstlogin', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    
    let user = req.session.user
    if(req.body.password == req.body.passwordconfirm){
        User.updateOne({username: user.username}, {$set: {password: req.body.password, firstLogin: false}}, function(err, user){});
        req.session.message = 'Đổi mật khẩu thành công'
    }
    return res.redirect('/')
})

// recovery
router.get('/recovery', (req, res) => {
    res.render('./Account/recovery')
});

router.post('/recovery', (req, res) => {
    var recovery = utils.generate_password(5)
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
    transporter.sendMail(mainOptions, function(err, info){
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            console.log('Message sent: ' +  info.response);
            res.redirect('/');
        }
    });
    return res.render('./Account/recoverycode')
});

router.post('/recoverypassword', (req, res) => {
    if(req.body.otp == req.session.recovery){
        return res.render('./Account/recoverypassword')
    }
    else {
        req.session.message = 'Sai mã xác thực'
        res.render('./Account/recoverycode')
    }
});

router.post('/successful', (req, res) => {
    if(req.body.newpassword == req.body.passwordconfirm){
        User.updateOne({email: req.session.email},
            {$set: {password: req.body.newpassword}}, function(err, user){
                console.log('khôi phục mật khẩu thành công')
            });
    }
    else return res.render('./Account/changepassword', {message : "Mật khẩu không trùng khớp"})

    return res.redirect('/')
    
});
    


// changepassword
router.get('/changepassword', (req, res) => {
    res.render('./Account/changepassword')
})

router.post('/changepassword', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    let user = req.session.user
    if(user.password == req.body.password){
        if(req.body.newpassword == req.body.passwordconfirm){
            User.updateOne({username: user.username},
                {$set: {password: req.body.newpassword}}, function(err, user){
                    console.log('Đổi mật khẩu thành công') 
                });
        }
        else return res.render('./Account/changepassword', {message : "Mật khẩu không trùng khớp"})
    }
    else return res.render('./Account/changepassword', {message : "Sai mật khẩu"})

    return res.redirect('/')
    
})

module.exports = router;