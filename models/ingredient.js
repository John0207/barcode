const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const IngredientSchema = new Schema ({
    name: String,
    description: String,
    createdDate: { type: Date, default: Date.now },
    quantity: Number, 
    quantityType: String,
    recipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    }],
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    }]          
});


module.exports = mongoose.model('Ingredient', IngredientSchema);