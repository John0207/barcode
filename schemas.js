const Joi = require('joi');

module.exports.itemSchema = Joi.object({
    item: Joi.object({
        title: Joi.string().required(),
        location: Joi.string().required(),
        price: Joi.number().required().min(0),
        upc: Joi.number().integer().required().min(0),
        quantity: Joi.number().required().min(0),
        quantityType: Joi.string().required(),
        caseQty: Joi.number().integer().required(),
        shelfLife: Joi.number().integer().min(1).required(),
        date: Joi.date().required(),
        expiration_date: Joi.date().allow(null, ''),
        image: Joi.string().allow(null, ''),
       }).required(),
    addIngredients: Joi.array().items(Joi.string()).allow(null, ''),        
    removeIngredients: Joi.array().items(Joi.string()).allow(null, ''),        
    removeIngs: Joi.array().items(Joi.string()).allow(null, ''),        
});


module.exports.recipeSchema = Joi.object({
    recipe: Joi.object({
        name: Joi.string().required(),
        recipe: Joi.string().required(),
        minTime: Joi.number().required().min(0),
        maxTime: Joi.number().required().min(0),
        createdDate: Joi.date().allow(null, ''),        
       }).required(),
    addIngredients: Joi.array().items(Joi.string()).allow(null, ''),        
    addIngs: Joi.array().items(Joi.string()).allow(null, ''),        
    removeIngredients: Joi.array().items(Joi.string()).allow(null, ''),        
    removeIngs: Joi.array().items(Joi.string()).allow(null, ''),        
});

module.exports.ingredientSchema = Joi.object({
    ingredient: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(null, ''),
        createdDate: Joi.date().allow(null, ''),
        quantity: Joi.number().required().min(0),
        quantityType: Joi.string().required(),
       }).required(),
    addIngredients: Joi.array().items(Joi.string()).allow(null, ''),        
    addIngs: Joi.array().items(Joi.string()).allow(null, ''),        
    addItems: Joi.array().items(Joi.string()).allow(null, ''),        
    addRecipes: Joi.array().items(Joi.string()).allow(null, ''),        
    removeIngredients: Joi.array().items(Joi.string()).allow(null, ''),        
    removeItems: Joi.array().items(Joi.string()).allow(null, ''),        
    removeRecipes: Joi.array().items(Joi.string()).allow(null, ''),        
    removeIngs: Joi.array().items(Joi.string()).allow(null, ''),        
});