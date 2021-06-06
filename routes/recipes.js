const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe');
const Ingredient = require('../models/ingredient');
const Item = require('../models/item');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const {recipeSchema} = require('../schemas.js');

const validateRecipe = (req, res, next) => {    
    const {error} = recipeSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

router.get('/', catchAsync(async (req, res) => {
    const recipes = await Recipe.find({});
    res.render('recipes/index', { recipes });
}))

router.post('/recipeSearch', catchAsync(async (req, res) => {
    if(!req.body.txtAutoComplete) throw new ExpressError('Invalid Search', 400);
    const txtAutoComplete = req.body.txtAutoComplete;
    const recipe = await Recipe.findOne({name: txtAutoComplete});
    if (recipe){
        const id = recipe._id;
        res.redirect(`/recipes/${id}`);
    } else {
        res.redirect("/recipes/");
    }    
}))

router.get('/new', catchAsync(async (req, res) => {
    const allIngredients = await Ingredient.find({});
    res.render('recipes/new', { allIngredients });
}))

router.post('/new', validateRecipe, catchAsync( async (req, res) => {
    const recipe = new Recipe(req.body.recipe);
    if (req.body.addIngredients){
        for (let id of req.body.addIngredients){
            let ingredient = await Ingredient.findById(id);
            recipe.ingredients.push(ingredient);
            ingredient.recipes.push(recipe);
            await ingredient.save();
        }
    }
    await recipe.save();
    res.redirect(`/recipes/${recipe._id}`);
    // console.log("it worked - " + recipe.name);
}))

router.get('/:id', catchAsync(async (req, res) => { 
    const recipe = await Recipe.findById(req.params.id).populate('ingredients');
    const itemsArray = [];
    const ingredientsNeededArray = [];
    for (let ingredient of recipe.ingredients){
        if((ingredient.items.length === 0)){
            ingredientsNeededArray.push(ingredient);
        }
        for (let id of ingredient.items){
            let item = await Item.findById(id);
            if(item){            
                if (item.quantity <= 0){
                    for (let id of item.ingredients){
                        let ingredient = await Ingredient.findById(id);
                        ingredientsNeededArray.push(ingredient); 
                    }
                } else {
                    itemsArray.push(item);
                }
            }
        }                      
    }
    
    // find matching ingredients if they exist to display them   
    res.render('recipes/show', { recipe, itemsArray, ingredientsNeededArray });

}))
router.get('/:id/edit', catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
    const existingIngredients = recipe.ingredients;
    const existingIngredientsArray = [];    
    for (let id of existingIngredients) {
        let ing = await Ingredient.findById(id);
        if (ing) {
            existingIngredientsArray.push(ing);
        }
    }    
    res.render('recipes/edit', { recipe, existingIngredientsArray });
}))
router.put('/:id', validateRecipe, catchAsync(async (req, res) => {
    if(!req.body.recipe) throw new ExpressError('Invalid Recipe', 400);
    const { id } = req.params;
    let recipe = await Recipe.findById(id);
    if(req.body.removeIngs){
        for (let iD of req.body.removeIngs) {
            let ing = await Ingredient.findById(iD);
            await recipe.updateOne({$pull: {ingredients: {$in: req.body.removeIngs}}});
            await ing.updateOne({$pull: {recipes: recipe._id}});
        }
    } else {
        let recipe = await Recipe.findByIdAndUpdate(id, { ...req.body.recipe });
    }
    
    res.redirect(`/recipes/${recipe._id}`)
}))

router.get('/:id/ingredients/new', catchAsync(async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);    
    const existingIngredients = recipe.ingredients;
    const allIngredients = await Ingredient.find({_id:{$nin: existingIngredients}});
    // const allIngredients = await Ingredient.find({});
    const existingIngredientsArray= [];
    //  console.log(allIngredients);
    for (let id of existingIngredients) {
        const ing = await Ingredient.findById(id);
        if (ing){
            // console.log(ing.name);
            existingIngredientsArray.push(ing);
        }        
        // console.log(ing);
    }
    // console.log(existingIngredientsArray);    
    res.render('ingredients/new', { recipe, allIngredients, existingIngredientsArray });
}))

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    res.redirect('/recipes');
}))

module.exports = router;
