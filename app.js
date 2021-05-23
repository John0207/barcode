const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const Item = require('./models/item');
const Recipe = require('./models/recipe');
const Ingredient = require('./models/ingredient');
const ingredients = require('./seeds/ingredients');
const ingredient = require('./models/ingredient');

const items = require('./routes/items');
const catchAsync = require('./utils/catchAsync');

mongoose.connect('mongodb://localhost:27017/barcode', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log('database connected');
});

const app = express();

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use('/items', items);


// https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd#:~:text=The%20simplest%20way%20to%20convert,getTimezoneOffset()%20*%2060000%20))%20.
app.locals.formatDate = (date) => {
    
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
    
    
}

app.locals.todaysDate = () => {

    const d = app.locals.formatDate(new Date());

    return d;
    
    
}

app.get('/', catchAsync(async (req, res) => {
    const today = new Date();
    const todayPlusSeven = new Date();
    todayPlusSeven.setDate(today.getDate() + 7 );
    const items = await Item.find({});
    const allPrices = await Item.aggregate([{ $group: { _id : null,  "prices" : { $sum: { "$multiply" : ["$price", "$quantity"] }}}}]);
    const throw_outs = await Item.find({ expiration_date: { $gte: today, $lte: todayPlusSeven } });
    const expired = await Item.find({ expiration_date: { $lte: today } }); 
    const total = allPrices[0].prices;   
    const average = total / items.length;
    const outOfStock = [];
    for (let item of items){
        if(item.quantity <= 0){
            outOfStock.push(item);
        }
    } 
    res.render('home', { items, total, average, throw_outs, expired, outOfStock })
}))


// !!!!!---------------------------------------------------------------!!!!!!!!!!!!!!!!
//                             recipe routes
app.get('/recipes', catchAsync(async (req, res) => {
    const recipes = await Recipe.find({});
    res.render('recipes/index', { recipes });
}))

app.post('/recipes/recipeSearch', catchAsync(async (req, res) => {
    const txtAutoComplete = req.body.txtAutoComplete;
    const recipe = await Recipe.findOne({name: txtAutoComplete});
    if (recipe){
        const id = recipe._id;
        res.redirect(`/recipes/${id}`);
    } else {
        res.redirect("/recipes/");
    }    
}))

app.get('/recipes/new', catchAsync(async (req, res) => {
    const allIngredients = await Ingredient.find({});
    res.render('recipes/new', { allIngredients });
}))

app.post('/recipes/new', catchAsync( async (req, res) => {
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

app.get('/recipes/:id', catchAsync(async (req, res) => { 
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

app.get('/recipes/:id/edit', catchAsync(async (req, res) => {
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

app.put('/recipes/:id', catchAsync(async (req, res) => {
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

app.get('/recipes/:id/ingredients/new', catchAsync(async (req, res) => {
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

app.delete('/recipes/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    res.redirect('/recipes');
}))

app.post('/ingredients/:id/new', catchAsync(async (req, res) => {
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


// !!!!!---------------------------------------------------------------!!!!!!!!!!!!!!!!
//                             Ingriedient routes


app.get('/ingredients', catchAsync(async (req, res) => {
    const ingredients = await Ingredient.find({});
    res.render('ingredients/index', { ingredients });
}))

app.post('/ingredients/ingredientSearch', catchAsync(async (req, res) => {
    const txtAutoComplete = req.body.txtAutoComplete;
    const ingredient = await Ingredient.findOne({name: txtAutoComplete});
    console.log(ingredient);    
    if (ingredient){
        const id = ingredient._id;
        res.redirect(`/ingredients/${id}`);
    } else {
        res.redirect("/ingredients/");
    }    
}))

app.get('/ingredients/new', (req, res) => {
    res.render('ingredients/new');
})

app.get('/ingredients/newFromScratch', catchAsync(async (req, res) => {
    const allItems = await Item.find({});
    const allRecipes = await Recipe.find({});
    res.render('ingredients/newFromScratch', { allItems, allRecipes });
}))

app.post('/ingredients/newFromScratch', catchAsync(async (req, res) => {
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

app.post('/ingredients/new', catchAsync(async (req, res) => {
    const ingredient = new Ingredient(req.body.ingredient);
    await ingredient.save();
    console.log("it worked" + ingredient.name);
}))

app.post('/ingredients/:id/items/newIngredient', catchAsync(async (req, res) => {
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


app.get('/ingredients/:id/items/newIngredient', catchAsync(async (req, res) => {
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

app.get('/ingredients/:id/recipes/newIngredient', catchAsync(async (req, res) => {
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

app.post('/ingredients/:id/recipes/newIngredient', catchAsync(async (req, res) => {
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


app.get('/ingredients/:id', catchAsync(async (req, res) => {
    const ingredient = await Ingredient.findById(req.params.id).populate('recipes');
    const ingredientItem = await Ingredient.findById(req.params.id).populate('items');
    // ingredient.populate('items');
    // await ingredient.save();
    console.log(ingredientItem.items);
    res.render('ingredients/show', { ingredient, ingredientItem });
}))

app.get('/ingredients/:id/edit', catchAsync(async (req, res) => {
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


app.put('/ingredients/:id', catchAsync(async (req, res) => {
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

app.delete('/ingredients/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Ingredient.findByIdAndDelete(id);
    res.redirect('/ingredients');
}))

app.use((err, req, res, next) => {
    res.send('oh boy something went wrong');
})


app.listen(3000, () => {
    console.log('Serving on port 3000')
})