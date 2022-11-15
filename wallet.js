const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')
const utils = require('./utils.js')

//deposit
router.get('/deposit/:username', (req, res,) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('deposit', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

router.post('/deposit/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    console.log(cardnumber + cvv)
    console.log(req.body.money) 
    let us = req.params.username
    if (cardnumber == 111111 && cvv == 411){
        User.findOne({username: us}, function(err, user){
            if(user != null){
                userbalance = parseInt(user.balance) + parseInt(req.body.money)
                User.updateOne({username: us},
                    {$set: {balance: userbalance} },
                     function(){
                        console.log('done')      
                    });
            } 
        });
        new Transaction({
            username: us,
            id: utils.generate_username(6),
            type: 'Nạp tiền',
            date: new Date(),
            status: 'Thành công',
            verified: true,
            value: req.body.money,
        }).save();
    }

    return res.redirect('/')
})
// withdraw
router.get('/withdraw/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }   
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            return res.render('withdraw', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

router.post('/withdraw/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    let us = req.params.username
    if (cardnumber == 111111 && cvv == 411){
        if(req.body.money % 50 == 0){
                User.findOne({username: us}, function(err, user){
                    if(user != null){
                        if(parseInt(user.balance) >= parseInt(req.body.money)){
                            if(req.body.money < 5000000){
                                userbalance = parseInt(user.balance) - parseInt(req.body.money) - (parseInt(req.body.money) * 5 / 100)
                                User.updateOne({username: us},
                                    {$set: {balance: userbalance} },
                                    function(){
                                        console.log('done')      
                                });
                                new Transaction({
                                    username: us,
                                    id: utils.generate_username(6),
                                    type: 'Rút tiền',
                                    date: new Date(),
                                    status: 'Thành công',
                                    verified: true,
                                    value: req.body.money,
                                }).save(); 
                            }else 
                                new Transaction({
                                    username: us,
                                    id: utils.generate_username(6),
                                    type: 'Rút tiền',
                                    date: new Date(),
                                    status: 'Chờ phê duyệt',
                                    verified: false,
                                    value: req.body.money,
                                }).save(); 

                        }else{
                            console.log('So tien khong du')
                        } 
                    } 
                });
               
            
        }else{
            console.log('So tien rut phai la boi so cua 50')    
        }
    }
    return res.redirect('/')
})

// transfer
router.get('/transfer/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('transfer', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

router.post('/transfer/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }

    let note = req.body.note
    let money = req.body.money
    let us = req.params.username

        User.findOne({username: us}, function(err, user){
            if(user != null){
                if(parseInt(user.balance) >= parseInt(money)){
                    if(money < 5000000){
                        senderbalance = parseInt(user.balance) - parseInt(money) - (parseInt(money) * 5 / 100)
                        User.updateOne({username: us},
                            {$set: {balance: senderbalance} },
                            function(){
                                console.log('done')      
                            });
                        User.findOne({phone: req.body.phone}, function(err, user){
                            receiverbalance = parseInt(user.balance) + parseInt(money)
                            User.updateOne({phone: req.body.phone},
                                {$set: {balance: receiverbalance} },
                                function(){   
                                    console.log('chuyen tien thanh cong cho ' + user.fullname) 
                                    console.log('số dư hiện tại' + receiverbalance) 
                                    console.log('số dư ban đầu ' + user.balance) 
                                }); 
                        });

                        new Transaction({
                            username: us,
                            id: utils.generate_username(6),
                            type: 'Chuyển tiền',
                            note: note,
                            date: new Date(),
                            status: 'Thành công',
                            verified: true,
                            value: req.body.money,
                        }).save(); 
                    }else 
                        new Transaction({
                            username: us,
                            id: utils.generate_username(6),
                            type: 'Chuyển tiền',
                            note: note,
                            date: new Date(),
                            status: 'Chờ phê duyệt',
                            verified: false,
                            value: req.body.money,
                        }).save(); 

                }else console.log('So tien khong du')
                    
            } 
        });
    return res.redirect('/')
})


// buycard
router.get('/buycard/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('buycard', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

router.post('/buycard/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    var card = []
        for (let i =0; i < req.body.amount;i++){
            card.push({cardcode: req.body.cardtype + utils.generate_username(5), cardprice: req.body.cardprice})
        }
        console.log(card)
            User.findOne({username: us}, function(err, user){
                if(user != null){
                    var value = parseInt(req.body.cardprice) * parseInt(req.body.amount)
                    var resultbalance = parseInt(user.balance) -  value
                    User.updateOne({username: us},
                        {$set: {balance: resultbalance} },
                        function(){    
                            new Transaction({
                                username: us,
                                id: utils.generate_username(6),
                                type: 'Mua card',
                                date: new Date(),
                                status: 'Thành công',
                                verified: true,
                                value: parseInt(req.body.cardprice) * parseInt(req.body.amount),
                                card: card
                            }).save();
                            console.log('so du hien tai ' + resultbalance)  
                        });
                } 
            });
        return res.render('buysuccessful', {card: card})
})


// history
router.get('/history/:username', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let us = req.params.username
    Transaction.find({username: us}, function(err, trans){
        if(trans != null){
            return res.render('history', {trans: trans})
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})


// transaction detail
router.get('/transaction/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let id = req.params.id
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            return res.render('transaction', trans)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})

module.exports = router;