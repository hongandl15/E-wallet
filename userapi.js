const fetch = require('node-fetch')
const url = 'https://web-nang-cao.herokuapp.com/lab5/users'
const token = ''
module.exports = {
    get_users: (page, callback) => {
        fetch(url + '?page=' + page)
        .then(res=>{
            return res.json()
        })
        .then(json=>callback(json))
    },
    get_user: (uid, callback) => {
        fetch(url + '/' + uid)
        .then(res=>{
            return res.json()
        })
        .then(json=>callback(json))
    },

    add_user: (user, callback) =>{
        fetch(url, {
            method: 'post',
            body: JSON.stringify(user),
            headers:{
                'Content-Type': 'application/json',
                'Authorization': 'Bearer' + token
            }
        })
        .then(res => res.json())
        .then(json => callback(json))
    },

    delete_user: (uid, callback) => {
        fetch(url + '/' + uid, {method: 'delete'})
        .then(res=>res.json())
        .then(json=>callback(json))
    },


    edit_user: (user, callback) =>{
        fetch(url, {
            method: 'put',
            body: JSON.stringify(user),
            headers:{
                'Content-Type': 'application/json',
                'Authorization': 'Bearer' + token
            }
        })
        .then(res => res.json())
        .then(json => callback(json))
    },

}