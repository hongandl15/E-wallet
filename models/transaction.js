const { json } = require('body-parser');
const mongoose = require('mongoose')


var transactionSchema = mongoose.Schema({
    username: String,
    id: String,
    type: String,
    note: String,
    date: Date,
    status: String,
    verified: Boolean,
    value: String,
    card: Array,
});

var Transaction = mongoose.model('transaction', transactionSchema);
module.exports = Transaction;