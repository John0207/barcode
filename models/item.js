const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ItemSchema = new Schema ({
    title: String,
    location: String, 
    upc: Number,
    quantity: Number,
    price: Number,
    caseQty: Number,
    date: String,
    shelfLife: Number,
    date_purchased_ISO: Date,
    expiration_date: Date, 
})
module.exports = mongoose.model('Item', ItemSchema);