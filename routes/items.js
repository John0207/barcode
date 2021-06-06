const express = require('express');
const router = express.Router();
const Item = require('../models/item');
const Ingredient = require('../models/ingredient');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const {itemSchema} = require('../schemas.js');

const validateItem = (req, res, next) => {    
    const {error} = itemSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

router.get('/', catchAsync(async (req, res) => {    
    const items = await Item.find({});    
    res.render('items/index', { items });
}))

router.post('/itemSearch', catchAsync(async (req, res) => {
    if(!req.body.txtAutoComplete) throw new ExpressError('Invalid Search', 400);
    const txtAutoComplete = req.body.txtAutoComplete;
    const item = await Item.findOne({title: txtAutoComplete});
    // console.log(item);    
    if (item){
        const id = item._id;
        res.redirect(`/items/${id}`);
    } else {
        res.redirect("/items/");
    }    
}))

router.get('/new', catchAsync(async (req, res) => {
    const allIngredients = await Ingredient.find({});    
    res.render('items/new', { allIngredients });
}))

router.get('/new-upc', (req, res) => {
    res.render('items/new');
})


router.get('/decrement-by-upc', (req, res) => {
    res.render('items/decrement-by-upc');
})

router.post('/decrement-by-upc', catchAsync(async(req, res) => {
    if(!req.body.upc || !req.body.multi) throw new ExpressError('Invalid UPC', 400);
    const  upc1  = req.body.upc;
    const item = await Item.findOne({upc: upc1});
    const multi = req.body.multi;
    const allIngredients = await Ingredient.find({});    
    if (item) {
        await Item.findOneAndUpdate({upc: upc1}, { quantity: item.quantity - (item.caseQty * multi)});
        console.log(item.title + " Successfully decremented using multiplier: " + multi);
        res.redirect("/items/decrement-by-upc");
    } else {
        res.render('items/new-upc', { upc1, allIngredients });
    }
})) 

router.post('/', validateItem, catchAsync(async (req, res) => {    
    const item = new Item(req.body.item);    
    if (!item.expiration_date && item.date && item.shelfLife) {        
        date = item.date;
        exDate = new Date(date.setDate(date.getDate() + item.shelfLife));
        await Item.findOneAndUpdate({title: item.title}, { expiration_date: exDate });
        // console.log(item.title + " is the title for this item");                
        // console.log(item.date);
        // console.log(exDate);
    }
    if (req.body.addIngredients) {
        for (let id of req.body.addIngredients){
            let ingredient = await Ingredient.findById(id);
            item.ingredients.push(ingredient);
            ingredient.items.push(item);
            await ingredient.save();
        }
    }
    await item.save();    
    res.redirect(`/items/${item._id}`);
}))

router.get('/add-by-upc', catchAsync(async (req, res) => {
    const allIngredients = await Ingredient.find({});
    res.render('items/add-by-upc', { allIngredients });
}))

router.post('/add-by-upc', catchAsync(async (req, res) => {
    if(!req.body.upc || !req.body.multi) throw new ExpressError('Invalid UPC', 400);
    const  upc1  = req.body.upc;
    const multi = req.body.multi;
    const item = await Item.findOne({upc: upc1});
    const allIngredients = await Ingredient.find({});
    if (item) {
        await Item.findOneAndUpdate({upc: upc1}, { quantity: item.quantity + (item.caseQty * multi) });
        console.log(item.title + " Successfully incremented using multiplier: " + multi);
        res.redirect("/items/add-by-upc");
    } else {
        res.render('items/new-upc', { upc1, allIngredients });     
    }
}))

router.get('/delete-by-upc', (req, res) => {
    res.render('items/delete-by-upc');
})

router.post('/delete-by-upc', catchAsync(async(req, res) => {
    if(!req.body.upc) throw new ExpressError('Invalid UPC', 400);
    const  upc1  = req.body.upc;
    const item = await Item.findOne({upc: upc1});
    if (item) {
        await Item.findOneAndDelete({upc: upc1});
        console.log(item.title + " Successfully removed");
        res.redirect("/items/delete-by-upc");
    } else {
        res.send('sorry item doesnt exist yet');
    }
}))   


router.get('/:id', catchAsync(async (req, res) => { 
    const item = await Item.findById(req.params.id).populate('ingredients');
    res.render('items/show', { item });
}))

router.get('/:id/edit', catchAsync(async (req, res) => {
    const item = await Item.findById(req.params.id)
    const existingIngredients = item.ingredients;
    const existingIngredientsArray = [];
    for (let id of existingIngredients) {
        const ing = await Ingredient.findById(id);
        if (ing) {
            existingIngredientsArray.push(ing);
        }
    }
    res.render('items/edit', { item, existingIngredientsArray });
}))

router.put('/:id', validateItem, catchAsync(async (req, res) => {
    if(!req.body.item) throw new ExpressError('Invalid Item', 400);
    const { id } = req.params;
    let item = await Item.findById(id);    
    if (req.body.removeIngs){        
        for (let iD of req.body.removeIngs){
            let ing = await Ingredient.findById(iD);            
            await item.updateOne({$pull: {ingredients: {$in: req.body.removeIngs}}});
            await ing.updateOne({$pull: {items: item._id}});
        }
    } else {
        let item = await Item.findByIdAndUpdate(id, { ...req.body.item });
    }
    res.redirect(`/items/${item._id}`)
}))


router.get('/:id/ingredients/newItem', catchAsync(async (req, res) => {
    const { id } = req.params;
    const item = await Item.findById(id);
    const existingIngredients = item.ingredients;
    const allIngredients = await Ingredient.find({_id:{$nin: existingIngredients}});
    const existingIngredientsArray = [];
    for (let id of existingIngredients) {
        const ing = await Ingredient.findById(id);
        if (ing) {
            existingIngredientsArray.push(ing);
        }
    }
    // console.log(existingIngredients + " " + allIngredients);
    res.render('ingredients/newItem', { item, allIngredients, existingIngredientsArray });
}))

// /ingredients/<%=item._id%>/new
router.post('/:id/ingredients/newItem', catchAsync(async (req, res) => {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!req.body.addIngs){
        const {name, description, quantity, quantityType} = req.body.ingredient;
        const ingredient = new Ingredient({name, description, quantity, quantityType});
        item.ingredients.push(ingredient);
        ingredient.items.push(item);
        await item.save();
        await ingredient.save();
    } else {
        for (let id of req.body.addIngs){
            let ing_id = await Ingredient.findById(id);
            item.ingredients.push(ing_id);
            ing_id.items.push(item);
            await item.save();
            await ing_id.save();
        }
    }
    res.redirect(`/items/${item._id}`)
}))

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.redirect('/items');
}))

module.exports = router;