const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe');
const Ingredient = require('../models/ingredient');
const Item = require('../models/item');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const {ingredientSchema} = require('../schemas.js');

const validateIngredient = (req, res, next) => {    
    const {error} = ingredientSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

router.post('/:id/new', catchAsync(async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    if(!req.body.addIngs){
        const {name, description, quantity, quantityType} = req.body.ingredient;
        const ingredient = new Ingredient({name, description, quantity, quantityType});
        recipe.ingredients.push(ingredient);
        ingredient.recipes.push(recipe);
        // console.log("empty selection")
        // console.log(req.body);
        await recipe.save();
        await ingredient.save();
    } else {
        for (let id of req.body.addIngs){
            let ing_id = await Ingredient.findById(id);
            recipe.ingredients.push(ing_id);
            ing_id.recipes.push(recipe);
            await recipe.save();
            await ing_id.save();
            // console.log(ing_id.name + " was added to " + recipe.name);
            // console.log(ing_id.recipes + "   " + recipe.ingredients);
        }
    }
    res.redirect(`/recipes/${recipe._id}`)
    // res.send(recipe);
    // await ingredient.save();
    // res.send(ingredient1);
}))


router.get('/', catchAsync(async (req, res) => {
    const ingredients = await Ingredient.find({});
    res.render('ingredients/index', { ingredients });
}))

router.post('/ingredientSearch', catchAsync(async (req, res) => {
    const txtAutoComplete = req.body.txtAutoComplete;
    const ingredient = await Ingredient.findOne({name: txtAutoComplete});
    if (ingredient){
        const id = ingredient._id;
        res.redirect(`/ingredients/${id}`);
    } else {
        res.redirect("/ingredients/");
    }    
}))

router.get('/ingredients/new', (req, res) => {
    res.render('ingredients/new');
})

router.get('/newFromScratch', catchAsync(async (req, res) => {
    const allItems = await Item.find({});
    const allRecipes = await Recipe.find({});
    res.render('ingredients/newFromScratch', { allItems, allRecipes });
}))

router.post('/newFromScratch', validateIngredient, catchAsync(async (req, res) => {
    const ingredient = new Ingredient(req.body.ingredient);
    if (req.body.addItems){
        for (let id of req.body.addItems){
            let item = await Item.findById(id);
            ingredient.items.push(item);
            item.ingredients.push(ingredient);
            await item.save();
        }
    } 
    if (req.body.addRecipes) {
        for (let id of req.body.addRecipes){
            let recipe = await Recipe.findById(id);
            ingredient.recipes.push(recipe);
            recipe.ingredients.push(ingredient);
            await recipe.save();
        }        
    }
    await ingredient.save();
    res.redirect(`/ingredients/${ingredient._id}`);
    // res.redirect('/ingredients');
    // console.log("it worked" + ingredient.name);
}))

router.post('/new', catchAsync(async (req, res) => {
    const ingredient = new Ingredient(req.body.ingredient);
    await ingredient.save();
    console.log("it worked" + ingredient.name);
}))

router.post('/:id/items/newIngredient', catchAsync(async (req, res) => {
    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);
    if(!req.body.addItems){
        const {title, location, upc, quantity, quantityType, price, caseQty, date, shelfLife, expiration_date} = req.body.item;
        const item = new Item({title, location, upc, quantity, quantityType, price, caseQty, date, shelfLife, expiration_date});
        ingredient.items.push(item);
        item.ingredients.push(ingredient);
        await item.save();
        await ingredient.save();
        if (!item.expiration_date && item.date && item.shelfLife) {        
            let thisDate = item.date;
            let exDate = new Date(thisDate.setDate(thisDate.getDate() + item.shelfLife));
            await Item.findOneAndUpdate({title: item.title}, { expiration_date: exDate });
            // console.log(item.title + " is the title for this item");                
            // console.log(item.date);
            // console.log(exDate);
        }
        // console.log("empty selection")
        // console.log(req.body);
    } else {
        for (let id of req.body.addItems){
            let item = await Item.findById(id);
            ingredient.items.push(item);
            item.ingredients.push(ingredient);
            await item.save();
            await ingredient.save();            
            // console.log(item.title + " was added to " + ingredient.name);
            // console.log(item.ingredients + "   " + ingredient.items);
        }
    }
    res.redirect(`/ingredients/${ingredient._id}`);
}))


router.get('/:id/items/newIngredient', catchAsync(async (req, res) => {
    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);
    const existingItems = ingredient.items;
    const allItems = await Item.find({_id:{$nin: existingItems}});
    const existingItemsArray = [];
    for (let id of existingItems) {
        const item = await Item.findById(id);
        if (item){
            // console.log(item.title);
            existingItemsArray.push(item);
        }
    }
    // console.log(existingItemsArray);
    res.render('items/newIngredient', { ingredient, allItems, existingItemsArray });
}))

router.get('/:id/recipes/newIngredient', catchAsync(async (req, res) => {
    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);
    const existingRecipes = ingredient.recipes;
    const allRecipes = await Recipe.find({_id:{$nin: existingRecipes}});
    const existingRecipesArray = [];
    for (let id of existingRecipes) {
        const recipe = await Recipe.findById(id);
        if (recipe) {
            existingRecipesArray.push(recipe);
        }
    }
    res.render('recipes/newIngredient', { ingredient, allRecipes, existingRecipesArray });
}))

router.post('/:id/recipes/newIngredient', catchAsync(async (req, res) => {
    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);
    // res.send(ingredient);
    if (!req.body.addRecipes){
        const {name, recipe, minTime, maxTime} = req.body.recipe;
        const rec_ipe = new Recipe({name, recipe, minTime, maxTime});
        ingredient.recipes.push(rec_ipe);
        rec_ipe.ingredients.push(ingredient);
        console.log(" new recipe " + rec_ipe.name + " was attached to " +  ingredient.name);
        await rec_ipe.save();
        await ingredient.save();
    } else {
        for (let id of req.body.addRecipes){
            let rec = await Recipe.findById(id);
            ingredient.recipes.push(rec);
            rec.ingredients.push(ingredient);
            console.log("existing recipe " + rec.name + " attached to " + ingredient.name);
            await ingredient.save();
            await rec.save();
        }
    }    
    res.redirect(`/ingredients/${ingredient._id}`)
}))


router.get('/:id', catchAsync(async (req, res) => {
    const ingredient = await Ingredient.findById(req.params.id).populate('recipes');
    const ingredientItem = await Ingredient.findById(req.params.id).populate('items');
    // ingredient.populate('items');
    // await ingredient.save();
    console.log(ingredientItem.items);
    res.render('ingredients/show', { ingredient, ingredientItem });
}))

router.get('/:id/edit', catchAsync(async (req, res) => {
    const ingredient = await Ingredient.findById(req.params.id)
    const existingItems = ingredient.items;
    const existingItemsArray = [];
    const existingRecipes = ingredient.recipes;
    const existingRecipesArray = [];
    for (let id of existingItems) {
        let item = await Item.findById(id);
        if (item) {
            existingItemsArray.push(item);
        }
    };
    for (let id of existingRecipes) {
        let recipe = await Recipe.findById(id); 
        if (recipe) {
            existingRecipesArray.push(recipe);
        }
    };
    res.render('ingredients/edit', { ingredient, existingItemsArray, existingRecipesArray });
}))

router.put('/:id', validateIngredient, catchAsync(async (req, res) => {
    const { id } = req.params;
    let ingredient = await Ingredient.findById(id);
    if(req.body.removeItems){
        for (let iD of req.body.removeItems) {
            let item = await Item.findById(iD);
            await ingredient.updateOne({$pull: {items: {$in: req.body.removeItems}}});
            await item.updateOne({$pull: {ingredients: ingredient._id}});
        }
    } 
    else if (req.body.removeRecipes) {
        for (let iD of req.body.removeRecipes){
            let recipe = await Recipe.findById(iD);
            await ingredient.updateOne({$pull: {recipes: {$in: req.body.removeRecipes}}});
            await recipe.updateOne({$pull: {ingredients: ingredient._id}});
        }
    } else {
        let ingredient = await Ingredient.findByIdAndUpdate(id, { ...req.body.ingredient });
    }    
    res.redirect(`/ingredients/${ingredient._id}`)
}))

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Ingredient.findByIdAndDelete(id);
    res.redirect('/ingredients');
}))

module.exports = router;