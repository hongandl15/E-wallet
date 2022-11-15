const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')
const utils = require('./utils.js')

//admin
router.get('/admin/users', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    User.find({verified: false, role: 'user'}, function(err, users){
        if(users != null){
            console.log(users)  
            return res.render('listusers', {users: users})
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})

router.get('/admin/transactions', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    Transaction.find({verified: true }, function(err, trans){
        if(trans != null){
            console.log(trans)  
            return res.render('adminlisttrans', {trans: trans})
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})

module.exports = router;