const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')
const utils = require('./utils.js')

//admin

//xem user
router.get('/admin/users/:type', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var type = req.params.type
    User.find({status: type, role: 'user'}, function(err, users){
        if(users != null){
            return res.render('listuser', {users: users})
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
            return res.render('adminuserdetails', {...user, verify, disable, addinfo, block})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

router.post('/admin/userprofile/:username/verify', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var us = req.params.username
        User.updateOne({username: us},
            {$set: {status: 'verified'}}, function(err, user){
                console.log('Kích hoạt tài khoản thành công') 
            });
    return res.redirect('/admin/userprofile/'+ us.username)
})

router.post('/admin/userprofile/:username/block', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var us = req.params.username
        User.updateOne({username: us},
            {$set: {status: 'blocked'}}, function(err, user){
                console.log('Kích hoạt tài khoản thành công') 
            });
    return res.redirect('/admin/userprofile/'+ us.username)
})

router.post('/admin/userprofile/:username/RequestIDCard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    var us = req.params.username
        User.updateOne({username: us},
            {$set: {status: 'RequestIDCard'}}, function(err, user){
                console.log('Yêu cầu bổ sung thông tin') 
            });
    return res.redirect('/admin/userprofile/'+ us.username)
})

// router.post('/admin/userprofile/:username/unblock', (req, res) => {
//     if (!req.session.user) {
//         return res.redirect('/login')
//     }
//     var us = req.params.username
//         User.updateOne({username: us},
//             {$set: {status: 'verified'}}, function(err, user){
//                 console.log('Kích hoạt tài khoản thành công') 
//             });
//     return res.redirect('/admin/userprofile/'+ us.username)

// })


//xem transactions
router.get('/admin/transactions', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    Transaction.find({verified: true }, function(err, trans){
        if(trans != null){ 
            return res.render('adminlisttrans', {trans: trans})
        } 
        else {  
            return res.redirect('/')
        }
    }).lean();
})

module.exports = router;