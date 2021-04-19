const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// should add location
const ItemSchema = new Schema ({
    title: String,
    location: String, 
    upc: Number,
    quantity: Number,
    price: Number,

})
module.exports = mongoose.model('Item', ItemSchema);