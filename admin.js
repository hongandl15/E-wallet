const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')
const nodemailer =  require('nodemailer');
var dataDir = __dirname + '/data';
var PhotoDir = dataDir + '/photo';
var fs = require('fs')
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(PhotoDir) || fs.mkdirSync(PhotoDir);

// Router admin

//xem danh sách user
router.get('/admin/users/:type', (req, res) => {
    if (!req.session.user)  return res.redirect('/login')
    else if(req.session.user.role != 'admin') return res.redirect('/')
    
    var type = req.params.type
    User.find({status: type, role: 'user'}, function(err, users){
        if(users != null){
            return res.render('./Admin/adminlistuser', {layout:'main-admin', title:'admin', users: users, type: type})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

router.get('/admin/userprofile/:username', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.role != 'admin') return res.redirect('/')
    var us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            var status = user.status
            var verify = ''
            if(status == 'blocked')
                verify = 'Mở khóa tài khoản'
            else if (status == 'unverified'){
                verify = 'Xác minh tài khoản'
                var disable = 'Vô hiệu hóa'
                var addinfo = 'Yêu cầu bổ sung thông tin'
            }
            else if (status == 'disabled'){
                verify = 'Kích hoạt lại tài khoản'
            }
            else if (status == 'verified'){
                var block = 'Khóa tài khoản'
            }
            return res.render('Admin/adminuserdetails', {layout:'main-admin', title:'admin', ...user, verify, disable, addinfo, block})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})
// Mở khóa / Khóa/ xác minh/ Vô hiệu hóa/ tài khoản
router.post('/admin/userprofile/:username/:status', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.role != 'admin') return res.redirect('/')
    
    var us = req.params.username
        User.updateOne({username: us},
            {$set: {status: req.params.status, wrongpw: 0, unusuallogin: 0}, }, function(err, user){
                console.log(req.params.status) 
            });
        req.session.success = 'Thao tác thành công'
    return res.redirect('/')
})

//xem danh sách transactions
router.get('/admin/transactions', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.role != 'admin') return res.redirect('/')
    
    Transaction.find({status: 'Chờ phê duyệt'}, function(err, trans){
        if(trans != null){ 
            return res.render('./Admin/adminlisttrans', {layout:'main-admin', title:'admin', trans: trans})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

//xem chi tiết transactions
router.get('/admin/transaction/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.role != 'admin') return res.redirect('/')
    let id = req.params.id
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            console.log(trans)
            if (trans.status == 'Chờ phê duyệt')
                var verify = 'Phê duyệt giao dịch'
                if(trans.type == 'Rút tiền'){
                    var verifytype = 'verifywithdraw'
                }else if (trans.type == 'Chuyển tiền'){
                    var verifytype = 'verifytransfer'
                }
            return res.render('./Admin/admintransaction', {layout:'main-admin', title:'admin', ...trans, verify, verifytype})
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})

// Phê duyệt giao dịch chuyển tiền
router.post('/admin/transaction/:id/verifytransfer', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.role != 'admin') return res.redirect('/')

    let id = req.params.id

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
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            User.findOne({username: trans.username}, function(err, user){
                if(user != null && parseInt(user.balance) >= (parseInt(trans.value) + parseInt(trans.value) * 5 / 100) ){
                    senderbalance = parseInt(user.balance) - parseInt(trans.value) -  (parseInt(trans.value) * 5 / 100)
                    console.log('sender balance ' + senderbalance)
                    User.updateOne({username: trans.username}, {$set: {balance: senderbalance}}, function(){});
                    var sendercontent = `
                    <div style="padding: 10px; background-color: white;">
                        <h4 style="color: #0085ff">Giao dịch thành công</h4>
                        <p style="color: black">Bạn vừa chuyển số tiền ` + parseInt(trans.value) + ` cho SĐT: `+ trans.receiver +`</p>
                        <p style="color: black">Số dư hiện tại của bạn là ` + senderbalance + `</p>
                    </div>
                    `;
        
                    var mainOptions = { 
                        from: 'EZB Wallet',
                        to: user.email,
                        subject: 'Giao dịch thành công',
                        html: sendercontent //Nội dung html mình đã tạo trên kia :))
                    }
                
                    transporter.sendMail(mainOptions, function(err, info){
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Message sent: ' +  info.response);
                        }
                    });
                } 
                else { 
                    Transaction.updateOne({id: id}, {$set: {status: 'Thất bại'}}, function(){});
                    req.session.error = 'Giao dịch thất bại do tài khoản gửi tiền không đủ số dư'
                    return res.redirect('/')
                }
            }).lean();

            User.findOne({phone: trans.receiver}, function(err, user){
                if(user != null){
                    receiverbalance = parseInt(user.balance) + parseInt(trans.value)
                    console.log('receiver balance ' + receiverbalance)
                    User.updateOne({phone: trans.receiver}, {$set: {balance: receiverbalance}}, function(){});
                    
                    var receivercontent = `
                    <div style="padding: 10px; background-color: white;">
                        <h4 style="color: #0085ff">Giao dịch thành công</h4>
                        <p style="color: black">Bạn vừa nhận được số tiền ` + parseInt(trans.value) + ` từ: `+ trans.username +`</p>
                        <p style="color: black">Số dư hiện tại của bạn là ` + receiverbalance + `</p>
                    </div>
                    `;
                    var mainOptions2 = { 
                        from: 'EZB Wallet',
                        to: user.email,
                        subject: 'Giao dịch thành công',
                        html: receivercontent //Nội dung html 
                    }

                    transporter.sendMail(mainOptions2, function(err, info){
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Message sent: ' +  info.response);
                        }
                    });
                } 
                else {  
                    return res.redirect('/')
                }
            }).lean();
            Transaction.updateOne({id: id}, {$set: {status: 'Thành công'}}, function(){});
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
    return res.redirect('/')
})

// phê duyệt giao dịch rút tiền
router.post('/admin/transaction/:id/verifywithdraw', (req, res) => {
    if (!req.session.user || req.session.user.role == 'user') return res.redirect('/login')
    let id = req.params.id
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            User.findOne({username: trans.username}, function(err, user){
                if(user != null && parseInt(user.balance) >= (parseInt(trans.value) + parseInt(trans.value) * 5 / 100) ){
                    balance = user.balance - parseInt(trans.value) - (parseInt(trans.value) * 5 / 100)
                    User.updateOne({username: trans.username}, {$set: {balance: balance}}, function(){});
                    Transaction.updateOne({id: id}, {$set: {status: 'Thành công'}}, function(){});
                } 
                else {
                    Transaction.updateOne({id: id}, {$set: {status: 'Thất bại'}}, function(){});
                    req.session.message = 'Giao dịch thất bại do tài khoản gửi tiền không đủ số dư'
                    return res.redirect('/')
                }
            }).lean();
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
    return res.redirect('/')
})

module.exports = router;