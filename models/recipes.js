const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const RecipeSchema = new Schema ({
    name: String,
    recipe: String,
    createdDate: { type: Date, default: Date.now }, 
    ingredients: [{
        type: Schema.Types.ObjectId,
        ref: 'Ingredient'
    }],     
});


module.exports = mongoose.model('Recipe', RecipeSchema);