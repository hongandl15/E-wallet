const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')
const utils = require('./utils.js')

//deposit
router.get('/deposit', (req, res,) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    return res.render('deposit', user)
})

router.post('/deposit', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    let user = req.session.user
    let expiredate = utils.getDate(req.body.expiredate)
    let date = new Date()
    if (cardnumber == 333333 && cvv == 577 && expiredate == '12/12/2022'){
        req.session.message = "Thẻ hết tiền"
        return res.render('deposit', {message: req.session.message})
    } 
    else if ((cardnumber == 111111 && cvv == 411 && expiredate == '10/10/2022') || (cardnumber == 222222 && cvv == 443 && expiredate == '11/11/2022')){
        if(cardnumber == 222222 && parseInt(req.body.money) > 1000000){
            req.session.message = 'Thẻ này chỉ được nạp tối đa 1.000.000/1 lần'
            return res.render('deposit', {message: req.session.message})
        }
        userbalance = parseInt(user.balance) + parseInt(req.body.money)
        User.updateOne({username: user.username},
            {$set: {balance: userbalance} },
                function(){
                req.session.message = 'Nạp tiền thành công'
            });
        new Transaction({
            username: user.username,
            id: utils.generate_username(6),
            type: 'Nạp tiền',
            date: utils.getDate(date),
            status: 'Thành công',
            verified: true,
            value: req.body.money,
        }).save();
    }else{
        req.session.message = "Sai thông tin thẻ";
        console.log("Sai thông tin thẻ")
        return res.render('deposit', {message: req.session.message})
    }
    return res.redirect('/')
});
// withdraw
router.get('/withdraw', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }   
    let user = req.session.user
    return res.render('withdraw', user)

})

router.post('/withdraw', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    let user = req.session.user
    let us = user.username
    let expiredate = req.body.expiredate
    let date = new Date()
    if (cardnumber == 111111 && cvv == 411 && expiredate == '10/10/2022'){
        if(req.body.money % 50 == 0){
            if(parseInt(user.balance) >= parseInt(req.body.money)){
                if(req.body.money < 5000000){
                    userbalance = parseInt(user.balance) - parseInt(req.body.money) - (parseInt(req.body.money) * 5 / 100)
                    User.updateOne({username: user.username},
                        {$set: {balance: userbalance} },function(){});
                    req.session.message = 'Rút tiền thành công'   
                    new Transaction({
                        username: us,
                        id: utils.generate_username(6),
                        type: 'Rút tiền',
                        date: utils.getDate(date),
                        status: 'Thành công',
                        verified: true,
                        value: req.body.money,
                    }).save(); 
                }else {
                    req.session.message = 'Rút tiền trên 5.000.000đ phải chờ phê duyệt'   
                    new Transaction({
                        username: us,
                        id: utils.generate_username(6),
                        type: 'Rút tiền',
                        date: utils.getDate(date),
                        status: 'Chờ phê duyệt',
                        verified: false,
                        value: req.body.money,
                    }).save(); 
                }
            }else{
                console.log('So tien khong du')
                req.session.message = 'Số dư không đủ'
                return res.render('withdraw', {message: req.session.message})
            }      
        }else{
            console.log('So tien rut phai la boi so cua 50')
            req.session.message = 'Số tiền rút phải là bội số của 50'
            return res.render('withdraw', {message: req.session.message})
        }
    }
    else{
        console.log('Sai thông tin thẻ')
        req.session.message = 'Sai thông tin thẻ'
        return res.render('withdraw', {message: req.session.message})
    }
    return res.redirect('/')
})

// transfer
router.get('/transfer', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    let us = user.username
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

router.post('/transfer', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let note = req.body.note
    let money = req.body.money
    let user = req.session.user
    let date = new Date()
        if(parseInt(user.balance) >= parseInt(money)){
            if(money < 5000000){
                senderbalance = parseInt(user.balance) - parseInt(money) - (parseInt(money) * 5 / 100)

                User.updateOne({username: us}, {$set: {balance: senderbalance}}, function(){});

                User.findOne({phone: req.body.phone}, function(err, user){
                    receiverbalance = parseInt(user.balance) + parseInt(money)
                    User.updateOne({phone: req.body.phone},
                        {$set: {balance: receiverbalance} },
                        function(){   
                            console.log('Chuyển tiền thành công cho: ' + user.fullname) 
                            console.log('số dư hiện tại' + receiverbalance) 
                            console.log('số dư ban đầu ' + user.balance) 
                        }); 
                });

                new Transaction({
                    username: us,
                    id: utils.generate_username(6),
                    type: 'Chuyển tiền',
                    note: note,
                    date: utils.getDate(date),
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
                    date: utils.getDate(date),
                    status: 'Chờ phê duyệt',
                    verified: false,
                    value: req.body.money,
                }).save(); 

        }else console.log('So tien khong du')
                    
    return res.redirect('/')
})


// buycard
router.get('/buycard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    return res.render('buycard', user)

})

router.post('/buycard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    let us = user.username
    var card = []
        for (let i =0; i < req.body.amount;i++){
            card.push({cardcode: req.body.cardtype + utils.generate_username(5), cardprice: req.body.cardprice})
        }
        console.log(card)
            User.findOne({username: us}, function(err, user){
                if(user != null){
                    var value = parseInt(req.body.cardprice) * parseInt(req.body.amount)
                    var resultbalance = parseInt(user.balance) -  value
                    if(user.balance >= value){
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
                    else{ 
                        console.log('so du khong du')   
                        return res.redirect('/')
                    }        
                } 
            });
        return res.render('buysuccessful', {card: card})
})


// history
router.get('/history', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    let user = req.session.user
    let us = user.username
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