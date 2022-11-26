const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')

// Router admin

//xem user
router.get('/admin/users/:type', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var type = req.params.type
    User.find({status: type, role: 'user'}, function(err, users){
        if(users != null){
            return res.render('./Admin/adminlistuser', {users: users})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

router.get('/admin/userprofile/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
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
            return res.render('Admin/adminuserdetails', {...user, verify, disable, addinfo, block})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

router.post('/admin/userprofile/:username/:status', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var us = req.params.username
        User.updateOne({username: us},
            {$set: {status: req.params.status}}, function(err, user){
                console.log(req.params.status) 
            });
    return res.redirect('/admin/userprofile/'+ us.username)
})

//xem danh sách transactions
router.get('/admin/transactions', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    Transaction.find({}, function(err, trans){
        if(trans != null){ 
            return res.render('./Admin/adminlisttrans', {trans: trans})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

//xem chi tiết transactions
router.get('/admin/transaction/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    let id = req.params.id
    // var verify = 'Chờ phê'
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
            return res.render('./Admin/admintransaction', {...trans, verify, verifytype})
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})

router.post('/admin/transaction/:id/verifytransfer', (req, res) => {
    if (!req.session.user || req.session.user.role == 'user') return res.redirect('/login')
    let id = req.params.id
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            User.findOne({username: trans.username}, function(err, user){
                if(user != null && parseInt(user.balance) >= (parseInt(trans.value) + parseInt(trans.value) * 5 / 100) ){
                    senderbalance = parseInt(user.balance) - parseInt(trans.value) -  (parseInt(trans.value) * 5 / 100)
                    console.log('sender balance ' + senderbalance)
                    User.updateOne({username: trans.username}, {$set: {balance: senderbalance}}, function(){});
                } 
                else { 
                    Transaction.updateOne({id: id}, {$set: {status: 'Thất bại'}}, function(){});
                    req.session.message = 'Giao dịch thất bại do tài khoản gửi tiền không đủ số dư'
                    return res.redirect('/')
                }
            }).lean();
            User.findOne({phone: trans.receiver}, function(err, user){
                if(user != null){
                    receiverbalance = parseInt(user.balance) + parseInt(trans.value)
                    console.log('receiver balance ' + receiverbalance)
                    User.updateOne({phone: trans.receiver}, {$set: {balance: receiverbalance}}, function(){});
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

router.post('/admin/transaction/:id/verifywithdraw', (req, res) => {
    if (!req.session.user || req.session.user.role == 'user') return res.redirect('/login')
    let id = req.params.id
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            User.findOne({username: trans.username}, function(err, user){
                if(user != null && parseInt(user.balance) >= (parseInt(trans.value) + parseInt(trans.value) * 5 / 100) ){
                    balance = user.balance - parseInt(trans.value) - (parseInt(trans.value) * 5 / 100)
                    User.updateOne({username: trans.username}, {$set: {balance: balance}}, function(){});
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