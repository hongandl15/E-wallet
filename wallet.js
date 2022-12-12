const express = require('express')
var router = express.Router();
const Transaction = require('./models/Transaction.js')
const User = require('./models/user.js')
const utils = require('./utils.js')
const nodemailer =  require('nodemailer');

//deposit
router.get('/deposit', (req, res,) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status != 'verified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    } 
    let user = req.session.user
    return res.render('./Wallet/deposit', user)
})

router.post('/deposit', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status != 'verified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    }  
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    let user = req.session.user
    let expiredate = utils.getDate(req.body.expiredate)
    let date = new Date()
    if (cardnumber == 333333 && cvv == 577 && expiredate == '12/12/2022'){
        return res.render('./Wallet/deposit', {error: 'Thẻ hết tiền'})
    } 
    else if ((cardnumber == 111111 && cvv == 411 && expiredate == '10/10/2022') || (cardnumber == 222222 && cvv == 443 && expiredate == '11/11/2022')){
        if(cardnumber == 222222 && parseInt(req.body.money) > 1000000)
            return res.render('./Wallet/deposit', {error: 'Thẻ này chỉ được nạp tối đa 1.000.000/1 lần'})
        
        userbalance = parseInt(user.balance) + parseInt(req.body.money)
        User.updateOne({username: user.username}, {$set: {balance: userbalance}}, function(){});
        req.session.success = 'Nạp tiền thành công'
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
        console.log("Sai thông tin thẻ")
        return res.render('./Wallet/deposit', {error: 'Sai thông tin thẻ'})
    }
    return res.redirect('/')
});

// withdraw
router.get('/withdraw', (req, res) => {
    if (!req.session.user) return res.redirect('/login') 
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status != 'verified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    }  
    let user = req.session.user
    return res.render('./Wallet/withdraw', user)
})

router.post('/withdraw', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status == 'unverified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    } 
    let cardnumber = req.body.cardnumber
    let cvv = req.body.cvv
    let user = req.session.user
    let us = user.username
    let expiredate = utils.getDate(req.body.expiredate)
    let date = new Date()
    if (cardnumber == 111111 && cvv == 411 && expiredate == '10/10/2022'){
        if(req.body.money % 50 == 0){
            if(parseInt(user.balance) >= parseInt(req.body.money)){
                if(req.body.money < 5000000){
                    userbalance = parseInt(user.balance) - parseInt(req.body.money) - (parseInt(req.body.money) * 5 / 100)
                    User.updateOne({username: user.username},
                        {$set: {balance: userbalance} },function(){});
                    req.session.success = 'Rút tiền thành công'   
                    new Transaction({
                        username: us,
                        id: utils.generate_username(6),
                        type: 'Rút tiền',
                        date: utils.getDate(date),
                        status: 'Thành công',
                        creditcard: cardnumber,
                        cvv: cvv,
                        verified: true,
                        value: req.body.money,
                    }).save(); 
                }else {
                    req.session.warning = 'Rút tiền trên 5.000.000đ phải chờ phê duyệt'   
                    new Transaction({
                        username: us,
                        id: utils.generate_username(6),
                        type: 'Rút tiền',
                        date: utils.getDate(date),
                        status: 'Chờ phê duyệt',
                        creditcard: cardnumber,
                        cvv: cvv,
                        verified: false,
                        value: req.body.money,
                    }).save(); 
                }
            }else{
                console.log('Số dư không đủ')
                return res.render('./Wallet/withdraw', {error: 'Số dư không đủ'})
            }      
        }else{
            console.log('Số tiền rút phải là bội số của 50')
            return res.render('./Wallet/withdraw', {error:'Số tiền rút phải là bội số của 50'})
        }
    }
    else{
        console.log('Sai thông tin thẻ')
        return res.render('./Wallet/withdraw', {error: 'Sai thông tin thẻ'})
    }
    return res.redirect('/')
})

// transfer
router.get('/transfer', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status != 'verified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    } 
    let user = req.session.user
    User.findOne({username: user.username}, function(err, user){
        if(user != null){
            console.log(user)  
            return res.render('./Wallet/transfer', user)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    });
})

router.post('/transfer', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status != 'verified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    }  
    let note = req.body.note
    let money = req.body.money
    let user = req.session.user
    let sendername = user.fullname
    let date = new Date()


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


    if(parseInt(user.balance) >= parseInt(money)){
        if(money < 5000000){
            if(req.body.who_pay == 'sender')
                senderbalance = parseInt(user.balance) - parseInt(money) - (parseInt(money) * 5 / 100)
            else
                senderbalance = parseInt(user.balance) - parseInt(money)

            User.updateOne({username: user.username}, {$set: {balance: senderbalance}}, function(){});
            
            User.findOne({phone: req.body.phone}, function(err, user){
                if(req.body.who_pay == 'sender')
                    receiverbalance = parseInt(user.balance) + parseInt(money)
                else 
                    receiverbalance = parseInt(user.balance) + parseInt(money) - (parseInt(money) * 5 / 100)
                User.updateOne({phone: req.body.phone}, {$set: {balance: receiverbalance}}, function(){});

                var content2 = `
                <div style="padding: 10px; background-color: white;">
                    <h4 style="color: #0085ff">Giao dịch thành công</h4>
                    <p style="color: black">Bạn vừa nhận được số tiền ` + parseInt(money) + ` từ: `+ sendername +`</p>
                    <p style="color: black">Số dư hiện tại của bạn là ` + receiverbalance + `</p>
                </div>
                `;
                var mainOptions2 = { 
                    from: 'EZB Wallet',
                    to: user.email,
                    subject: 'Giao dịch thành công',
                    html: content2 //Nội dung html 
                }

                transporter.sendMail(mainOptions2, function(err, info){
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Message sent: ' +  info.response);
                    }
                });

            });
                        
            var content = `
            <div style="padding: 10px; background-color: white;">
                <h4 style="color: #0085ff">Giao dịch thành công</h4>
                <p style="color: black">Bạn vừa chuyển số tiền ` + parseInt(money) + ` cho SĐT: `+ req.body.phone +`</p>
                <p style="color: black">Số dư hiện tại của bạn là ` + senderbalance + `</p>
            </div>
            `;

            var mainOptions = { 
                from: 'EZB Wallet',
                to: user.email,
                subject: 'Giao dịch thành công',
                html: content //Nội dung html mình đã tạo trên kia :))
            }

            
            transporter.sendMail(mainOptions, function(err, info){
                if (err) {
                    console.log(err);
                } else {
                    console.log('Message sent: ' +  info.response);
                }
            });
            req.session.success = 'Chuyển tiền thành công'  
            new Transaction({
                username: user.username,
                receiver: req.body.phone,
                id: utils.generate_username(6),
                type: 'Chuyển tiền',
                note: note,
                date: utils.getDate(date),
                status: 'Thành công',
                verified: true,
                value: req.body.money,
            }).save();

            
        }else 
            req.session.warning = 'Chuyển tiền trên 5.000.000đ phải chờ phê duyệt'   
            new Transaction({
                username: user.username,
                receiver: req.body.phone,
                id: utils.generate_username(6),    
                type: 'Chuyển tiền',
                note: note,
                date: utils.getDate(date),
                status: 'Chờ phê duyệt',
                verified: false,
                value: req.body.money,
            }).save(); 

    }else{
        console.log('Số dư không đủ')
        req.session.error = 'Số dư không đủ'
        return res.render('./Wallet/transfer', {error: req.session.error})
    } 
                    
    return res.redirect('/')
})


// buycard
router.get('/buycard', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status == 'unverified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    } 
    let user = req.session.user
    return res.render('./Wallet/buycard', user)
})

router.post('/buycard', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status == 'unverified'){
        req.session.error = 'chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
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
                                console.log('Số dư hiện tại ' + resultbalance)  
                        });
                    }
                    else{ 
                        console.log('Số dư không đủ')
                        req.session.error = 'Số dư không đủ'
                        return res.render('./Wallet/buycard', {error: req.session.error})
                    }        
                } 
            });
        return res.render('./Wallet/buysuccessful', {card: card})
})


// history
router.get('/history', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status != 'verified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    } 
    let user = req.session.user
    Transaction.find({username: user.username}, function(err, trans){
        if(trans != null){
            return res.render('./Wallet/history', {trans: trans})
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})


// transaction detail
router.get('/transaction/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    else if(req.session.user.firstLogin){ 
        return res.render('./Account/firstlogin') 
    }
    else if(req.session.user.status == 'unverified'){
        req.session.error = 'Chức năng này chỉ dành cho tài khoản đã được xác minh'
        return res.redirect('/')
    } 
    let id = req.params.id
    Transaction.findOne({id: id}, function(err, trans){
        if(trans != null){
            console.log(trans)
            return res.render('./Wallet/transaction', trans)
        } 
        else {  
            console.log(err)
            return res.redirect('/')
        }
    }).lean();
})

module.exports = router;