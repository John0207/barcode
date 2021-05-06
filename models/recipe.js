const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Item = require('./item');

const RecipeSchema = new Schema ({
    name: String,
    recipe: String,
    minTime: Number,
    maxTime: Number,
    createdDate: { type: Date, default: Date.now },
    ingredients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
    }], 
    item_ingredients: [{
        type: Schema.Types.ObjectId,
        ref: 'Item'
    }],     
});


module.exports = mongoose.model('Recipe', RecipeSchema);