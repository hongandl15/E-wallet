const express = require('express')
const hbs = require('express-handlebars')
const api = require('./userapi')
const session = require('express-session')
const app = express()
const port = 3000
const mongoose = require('mongoose')
const User = require('./models/user.js')

 mongoose.connect('mongodb://localhost:27017', function (err) {
  
    if (err) throw err;
  
    console.log('Successfully connected');
  
 });


User.find(function(err, users){
    if(users.length) return;
    new User({
        username: 'admin',
        password: '123456',
        fullname: 'An Nguyen',
        available: true
    }).save();
})

app.engine('handlebars', hbs.engine({
    defaultLayout: 'main',
    helpers: {
        show_paging: (page, page_count, num_page_show) =>{
            let idx = page - parseInt(num_page_show/2)
            if (idx<=0)
                idx = 1
            let html =''
            if (page <= 1)
                html += `<li class="page-item disabled"><a class="page-link" href="#"> Previous</a> </li>`
            else
                html += `<li class="page-item"><a class="page-link" href="/${page-1}"> Previous</a> </li>`
            while (num_page_show > 0 && idx <= page_count){
                html += `<li class="page-item${(idx == page?" active":"")}"><a class="page-link" href="/${idx}">${idx}</a></li>`
                idx++
                num_page_show--
            }
            //link next
            if (page >= page_count)
                html += `<li class="page-item disabled"><a class="page-link" href="#"> Previous</a> </li>`
            else
                html += `<li class="page-item"><a class="page-link" href="/${page+1}"> Previous</a> </li>`
            return html
            }
    }
}))

app.set('view engine', 'handlebars')
app.use(express.urlencoded())
app.use(session({ secret: 'fafsdhalj' }))


app.get('/', (req, res) => {
    if (!req.session.islogined) {
        return res.redirect('/login')
    }
    User.find({}, function(err, users){
        var context = {
            users: users.map(function(user){
                return{
                    username: user.username,
                    password: user.password,
                    fullname: user.fullname
                }
            })
        };
        return res.render('index', {...context, title: 'trang chủ' })
    });
})


app.get('/add', (req, res) => {
    if (!req.session.islogined) {
        return res.redirect('/login')
    }
    res.render('add')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', function(req, res){
    let us = req.body.username
    let pw = req.body.password
    User.findOne({username: us, password: pw}, function(err, user){
        if(user != null){
            req.session.islogined = true
            console.log(user)
            return res.redirect('/')
        } 
        else {
            console.log(err)
            return res.render('login', { layout: null, error: true })
        }
    });
});


app.get('/user/:username', (req, res) => {
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('details', user)
        } 
        else {
            console.log(err)
            return res.redirect('/')
        }
    });
})


app.post('/add', (req, res) => {
    User.find(function(err, users){
        if(err) throw err;
        new User({
            username: req.body.username,
            password: req.body.password,
            fullname: req.body.fullname,
            available: true
        }).save();
        return res.redirect('/')
    })
    
})


app.delete('/delete/:username', (req, res) => {
    let us = req.params.username
    User.deleteOne({username: us}, function(err, users){
        if(err) throw err;
        
    })
    return res.render('index', {message : "da xoa thanh cong"})
})


app.get('/update/:username', (req, res) => {
    let us = req.params.username
    User.findOne({username: us}, function(err, user){
        if(user != null){
            console.log(us)  
            return res.render('edit', user)
        } 
        else {
            console.log(err)
            return res.redirect('/')
        }
    });
})

app.post('/update/:username', (req, res) => {
    let us = req.params.username
    User.updateOne({username: us},
        {$set: {username: req.body.username, password: req.body.password, fullname: req.body.fullname} },
         function(err,user){     
            console.log(user)      
        return res.redirect('/')
    });
})


app.listen(port, () => console.log(`Express started on https:/localhost:${port};`))