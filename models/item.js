const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ItemSchema = new Schema ({
    title: String,
    location: String, 
    upc: Number,
    quantity: Number,
    quantityType: String,
    price: Number,
    caseQty: Number,
    date: Date,
    shelfLife: Number,
    expiration_date: Date,
    image: String,
    ingredients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient'
    }],
    recipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    }],  
})

// ItemSchema.post('find', async function() {
//     const today = new Date();
//     const expired = await Item.find({ expiration_date: { $lte: today } });
//     // for (let item in expired){
//     //     const expired_item = new ExpiredItem(item);
//     //     await expired_item.save();
//     //     console.log(item);
//     // }
//     console.log(today);
//     // next();
// })

// ItemSchema.pre('findOneAndUpdate', function (next) {
//     console.log('middleware test');
//     next();
// })
// ItemSchema.pre('findOneAndUpdate', function (next) {
//     console.log('middleware test');
//     next();
// })
module.exports = mongoose.model('Item', ItemSchema);