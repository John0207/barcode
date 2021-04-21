const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ItemSchema = new Schema ({
    title: String,
    location: String, 
    upc: Number,
    quantity: Number,
    price: Number,
    caseQty: Number,
    

})
module.exports = mongoose.model('Item', ItemSchema);