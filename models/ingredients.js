const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const IngredientSchema = new Schema ({
    name: String,
    description: String,
    createdDate: { type: Date, default: Date.now },
    quantity: Number, 
    quantityType: String, 
    // ingredients: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Ingredient'
    // }],     
});


module.exports = mongoose.model('Ingredient', IngredientSchema);