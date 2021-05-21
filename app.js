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


// https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd#:~:text=The%20simplest%20way%20to%20convert,getTimezoneOffset()%20*%2060000%20))%20.


// const createExpiration = async (req, res, next) => {
//     const items = await Item.find({});
//     for (let i=0; i < items.length; i++) {        
//         console.log(items[i].title);
//         if (!item[i].date){
//             // dateNow = new Date();
//             // dateNowString = dateNow.toISOString().slice(0,10).replace(/-/g,"");
//             // await Item.findOneAndUpdate({title: item[i].title}, { date: dateNowString});
//             console.log(item[i].title + " was given the current date " + dateNowString);
//         }
//     //     if (!item[i].date_purchased_ISO && item[i].date){
//     //         await Item.findOneAndUpdate({title: item[i].title}, { date_purchased_ISO: item[i].date});
//     //         console.log(item[i].title + " had it's iso date set because it had none")
//     //     }
//     //     if (!items[i].expiration_date && items[i].date_purchased_ISO && items[i].shelfLife){            
//     //         dateMiddleware = new Date(items[i].date);
//     //         exDateMiddleware = new Date(dateMiddleware.setDate(dateMiddleware.getDate() + items[i].shelfLife));
//     //         await Item.findOneAndUpdate({title: items[i].title}, {expiration_date: exDateMiddleware});
//     //         console.log(items[i].title + " expiration date was reset and is now " + items[i].expiration_date);
//     //     }
//     // }
//         console.log(items.length);
//         console.log('middleware test for all routes!');
//         next();
//     }
// };

// app.use(createExpiration);

app.get('/', async (req, res) => {
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
})

app.get('/items', async (req, res) => {
    // const today = new Date();
    // const todayPlusSeven = new Date();
    // todayPlusSeven.setDate(today.getDate() + 7 );
    const items = await Item.find({});
    // const allPrices = await Item.aggregate([{ $group: { _id : null,  "prices" : { $sum: { "$multiply" : ["$price", "$quantity"] }}}}]);
    // const throw_outs = await Item.find({ expiration_date: { $gte: today, $lte: todayPlusSeven } });
    // const expired = await Item.find({ expiration_date: { $lte: today } }); 
    // const total = allPrices[0].prices;   
    // const average = total / items.length;
    // const outOfStock = [];
    // for (let item of items){
    //     if(item.quantity <= 0){
    //         outOfStock.push(item);
    //     }
    // }   
    // console.log(todayPlusSeven);
    // console.log(throw_outs);
    res.render('items/index', { items });
})

app.post('/items/itemSearch', async (req, res) => {
    const txtAutoComplete = req.body.txtAutoComplete;
    const item = await Item.findOne({title: txtAutoComplete});
    // console.log(item);    
    if (item){
        const id = item._id;
        res.redirect(`/items/${id}`);
    } else {
        res.redirect("/items/");
    }    
})

app.get('/items/new', async (req, res) => {
    const allIngredients = await Ingredient.find({});    
    res.render('items/new', { allIngredients });
})

app.get('/items/new-upc', (req, res) => {
    res.render('items/new');
})


app.get('/items/decrement-by-upc', (req, res) => {
    res.render('items/decrement-by-upc');
})

app.post('/items/decrement-by-upc', async(req, res) => {
    const  upc1  = req.body.upc;
    const item = await Item.findOne({upc: upc1});
    const multi = req.body.multi;
    if (item) {
        await Item.findOneAndUpdate({upc: upc1}, { quantity: item.quantity - (item.caseQty * multi)});
        console.log(item.title + " Successfully decremented using multiplier: " + multi);
        res.redirect("/items/decrement-by-upc");
    } else {
        res.render('items/new-upc', { upc1 });
    }
}) 

app.post('/items', async (req, res) => {
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
})



app.get('/items/add-by-upc', async (req, res) => {
    const allIngredients = await Ingredient.find({});
    res.render('items/add-by-upc', { allIngredients });
})

app.post('/items/add-by-upc', async (req, res) => {
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

        // FIX ERROR WHEN PAGE REFRESHES IT EXECUTES

    }
})

app.get('/items/delete-by-upc', (req, res) => {
    res.render('items/delete-by-upc');
})

app.post('/items/delete-by-upc', async(req, res) => {
    const  upc1  = req.body.upc;
    const item = await Item.findOne({upc: upc1});
    if (item) {
        await Item.findOneAndDelete({upc: upc1});
        console.log(item.title + " Successfully removed");
        res.redirect("/items/delete-by-upc");
    } else {
        res.send('sorry item doesnt exist yet');
    }
})   


app.get('/items/:id', async (req, res) => { 
    const item = await Item.findById(req.params.id).populate('ingredients');
    res.render('items/show', { item });

})

app.get('/items/:id/edit', async (req, res) => {
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
})

app.put('/items/:id', async (req, res) => {
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
});


app.get('/items/:id/ingredients/newItem', async (req, res) => {
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
})

// /ingredients/<%=item._id%>/new
app.post('/ingredients/:id/newItem', async (req, res) => {
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
})

app.delete('/items/:id', async (req, res) => {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.redirect('/items');
});

// !!!!!---------------------------------------------------------------!!!!!!!!!!!!!!!!
//                             recipe routes
app.get('/recipes', async (req, res) => {
    const recipes = await Recipe.find({});
    res.render('recipes/index', { recipes });
})

app.post('/recipes/recipeSearch', async (req, res) => {
    const txtAutoComplete = req.body.txtAutoComplete;
    const recipe = await Recipe.findOne({name: txtAutoComplete});
    if (recipe){
        const id = recipe._id;
        res.redirect(`/recipes/${id}`);
    } else {
        res.redirect("/recipes/");
    }    
})

app.get('/recipes/new', async (req, res) => {
    const allIngredients = await Ingredient.find({});
    res.render('recipes/new', { allIngredients });
})

app.post('/recipes/new', async (req, res) => {
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
})

app.get('/recipes/:id', async (req, res) => { 
    const recipe = await Recipe.findById(req.params.id).populate('ingredients');
    const itemsArray = [];
    const ingredientsNeededArray = [];
    for (let ingredient of recipe.ingredients){
        if(ingredient.items.length === 0){
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

})

app.get('/recipes/:id/edit', async (req, res) => {
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
})

app.put('/recipes/:id', async (req, res) => {
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
});

app.get('/recipes/:id/ingredients/new', async (req, res) => {
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
})

app.delete('/recipes/:id', async (req, res) => {
    const { id } = req.params;
    await Recipe.findByIdAndDelete(id);
    res.redirect('/recipes');
});

app.post('/ingredients/:id/new', async (req, res) => {
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
})


// !!!!!---------------------------------------------------------------!!!!!!!!!!!!!!!!
//                             Ingriedient routes


app.get('/ingredients', async (req, res) => {
    const ingredients = await Ingredient.find({});
    res.render('ingredients/index', { ingredients });
})

app.post('/ingredients/ingredientSearch', async (req, res) => {
    const txtAutoComplete = req.body.txtAutoComplete;
    const ingredient = await Ingredient.findOne({name: txtAutoComplete});
    console.log(ingredient);    
    if (ingredient){
        const id = ingredient._id;
        res.redirect(`/ingredients/${id}`);
    } else {
        res.redirect("/ingredients/");
    }    
})

app.get('/ingredients/new', (req, res) => {
    res.render('ingredients/new');
})

app.get('/ingredients/newFromScratch', async (req, res) => {
    const allItems = await Item.find({});
    const allRecipes = await Recipe.find({});
    res.render('ingredients/newFromScratch', { allItems, allRecipes });
})

app.post('/ingredients/newFromScratch', async (req, res) => {
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
})
app.post('/ingredients/new', async (req, res) => {
    const ingredient = new Ingredient(req.body.ingredient);
    await ingredient.save();
    console.log("it worked" + ingredient.name);
})

app.post('/ingredients/:id/items/newIngredient', async (req, res) => {
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
})


app.get('/ingredients/:id/items/newIngredient', async (req, res) => {
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
})

app.get('/ingredients/:id/recipes/newIngredient', async (req, res) => {
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
})

app.post('/ingredients/:id/recipes/newIngredient', async (req, res) => {
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
})


app.get('/ingredients/:id', async (req, res) => {
    const ingredient = await Ingredient.findById(req.params.id).populate('recipes');
    const ingredientItem = await Ingredient.findById(req.params.id).populate('items');
    // ingredient.populate('items');
    // await ingredient.save();
    console.log(ingredientItem.items);
    res.render('ingredients/show', { ingredient, ingredientItem });
})

app.get('/ingredients/:id/edit', async (req, res) => {
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
})


app.put('/ingredients/:id', async (req, res) => {
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
});

app.delete('/ingredients/:id', async (req, res) => {
    const { id } = req.params;
    await Ingredient.findByIdAndDelete(id);
    res.redirect('/ingredients');
});


app.listen(3000, () => {
    console.log('Serving on port 3000')
})