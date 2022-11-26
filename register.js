const express = require('express')
var router = express.Router();
const User = require('./models/user.js')
const utils = require('./utils.js')
var formidable = require('formidable');
var dataDir = __dirname + '/data';
var PhotoDir = dataDir + '/photo';
const nodemailer =  require('nodemailer');
var fs = require('fs')
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(PhotoDir) || fs.mkdirSync(PhotoDir);

// register
router.get('/register', (req, res) => {
    res.render('./Account/register')
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
            fs.copyFile(frontoldPath, frontnewPath, function (err) { //đổi tên ảnh CMND mặt trước
                if (err) throw err;
            });

            fs.copyFile(backoldPath, backnewPath, function (err) { //đổi tên ảnh CMND mặt sau
                if (err) throw err;
            });

            var newusername = utils.generate_username(9)
            var newpassword = utils.generate_password(6)

            // tạo user trong database
            new User({
                username: newusername,
                password: newpassword,
                fullname: fields.fullname,
                phone: fields.phone,
                email: fields.email,
                address: fields.address,
                Birthdate: utils.getDate(fields.birthdate),
                balance: 0,
                available: true,
                firstLogin: true,
                status: 'unverified',
                role: 'user',
                wrongpw: 0,
                unusuallogin: 0,
                unusuallogintime: utils.getTime(new Date),
                idcard:{
                    photofrontName: photofrontName,
                    photofrontPath: frontnewPath,
                    photobackName: photobackName,
                    photobackPath: backnewPath,
                } ,
                available: true
            }).save();

            // Chức năng gửi email username và password
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
            content = `
                    <div style="padding: 10px; background-color: white;">
                        <h4 style="color: #0085ff">Cảm ơn bạn đã đăng kí tài khoản EZB Wallet</h4>
                        <span style="color: black">Đây là username và password của bạn</span>
                        <p style="color: black">username: ` + newusername + `</p>
                        <p style="color: black">password: ` + newpassword + `</p>
                    </div>
            `;
            var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
                from: 'EZB Wallet',
                to: fields.email,
                subject: 'Đăng kí thành công EZB Wallet',
                // text: 'Cảm ơn bạn đã đăng kí. Username và mật khẩu của bạn là',
                html: content //Nội dung html mình đã tạo trên kia :))
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
        });
    req.session.message = 'Đăng kí thành công tài khoản và mật khẩu đã được gửi về email của bạn. Nếu không nhận được mail hãy kiểm tra thư mục spam'
    return res.redirect('/')
}) 

module.exports = router;