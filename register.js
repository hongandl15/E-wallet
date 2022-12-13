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

// register - Chức năng đăng kí
router.get('/register', (req, res) => {
    res.render('./Account/register',  {layout: 'main-login', title: 'Đăng kí'})
})
router.post('/register', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function(err, fields, files){
            if(err) return res.redirect(303, '/404');

            var photofrontName = fields.phone + 'IDCardFront' // Tạo tên cho ảnh CMND mặt trước SĐT + IDCardFront
            var photobackName = fields.phone + 'IDCardBack'// Tạo tên cho ảnh CMND mặt sau SĐT + IDCardBack

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

            var newusername = utils.generate_username(9) // Tạo username
            var newpassword = utils.generate_password(6) // Tạo password

            // Lưu vào database
            new User({
                username: newusername,
                password: newpassword,
                fullname: fields.fullname,
                phone: fields.phone,
                email: fields.email,
                address: fields.address,
                Birthdate: utils.getDate(fields.birthdate),
                balance: 0,
                firstLogin: true,
                status: 'unverified', // Tài khoản mới tạo sẽ chưa được xác minh
                role: 'user',
                wrongpw: 0,
                unusuallogin: 0,
                idcard:{
                    photofrontName: photofrontName,
                    photofrontPath: frontnewPath,
                    photobackName: photobackName,
                    photobackPath: backnewPath,
                } ,
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
                html: content //Nội dung html cho email
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
    req.session.loginsuccess = 'Đăng kí thành công, tài khoản và mật khẩu đã được gửi về email của bạn. Nếu không nhận được mail hãy kiểm tra thư mục spam'
    return res.redirect('/')
}) 

module.exports = router;