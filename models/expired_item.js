const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ExpiredItemSchema = new Schema ({
    title: String,
    location: String, 
    upc: Number,
    quantity: Number,
    price: Number,
    caseQty: Number,
    date: Date,
    shelfLife: Number,
    expiration_date: Date, 
})

module.exports = mongoose.model('ExpiredItem', ExpiredItemSchema);