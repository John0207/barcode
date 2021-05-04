const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

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

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/items', async (req, res) => {
    const today = new Date();
    const todayPlusSeven = new Date();
    todayPlusSeven.setDate(today.getDate() + 7 );
    const items = await Item.find({});
    const allPrices = await Item.aggregate([{ $group: { _id : null,  "prices" : { $sum: { "$multiply" : ["$price", "$quantity"] }}}}]);
    const throw_outs = await Item.find({ expiration_date: { $gte: today, $lte: todayPlusSeven } });
    const expired = await Item.find({ expiration_date: { $lte: today } }); 
    const total = allPrices[0].prices;   
    const average = total / items.length;   
    // console.log(todayPlusSeven);
    // console.log(throw_outs);
    res.render('items/index', { items, total, average, throw_outs, expired });
})


app.get('/items/new', (req, res) => {
    res.render('items/new');
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
    await item.save();
    if (!item.expiration_date && item.date && item.shelfLife) {        
        // await Item.findOneAndUpdate({title: item.title}, { date_purchased_ISO: item.date});
        date = item.date;
        exDate = new Date(date.setDate(date.getDate() + item.shelfLife));
        await Item.findOneAndUpdate({title: item.title}, { expiration_date: exDate });
        console.log(item.title + " is the title for this item");                
        console.log(item.date);
        console.log(exDate);
    }    
    res.redirect(`/items/${item._id}`);
})



app.get('/items/add-by-upc', (req, res) => {
    res.render('items/add-by-upc');
})

app.post('/items/add-by-upc', async (req, res) => {
    const  upc1  = req.body.upc;
    const multi = req.body.multi;
    const item = await Item.findOne({upc: upc1});
    if (item) {
        await Item.findOneAndUpdate({upc: upc1}, { quantity: item.quantity + (item.caseQty * multi) });
        console.log(item.title + " Successfully incremented using multiplier: " + multi);
        res.redirect("/items/add-by-upc");
    } else {
        res.render('items/new-upc', { upc1 });

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
    const item = await Item.findById(req.params.id);   
    res.render('items/show', { item });

})

app.get('/items/:id/edit', async (req, res) => {
    const item = await Item.findById(req.params.id)
    res.render('items/edit', { item });
})

app.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const item = await Item.findByIdAndUpdate(id, { ...req.body.item });
    res.redirect(`/items/${item._id}`)
});



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

app.get('/recipes/new', (req, res) => {
    res.render('recipes/new');
})

app.post('/recipes/new', async (req, res) => {
    const recipe = new Recipe(req.body.recipe);
    await recipe.save();
    console.log("it worked" + recipe.name);
})

app.get('/recipes/:id', async (req, res) => { 
    const recipe = await Recipe.findById(req.params.id);   
    res.render('recipes/show', { recipe });

})

app.get('/recipes/:id/edit', async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
    res.render('recipes/edit', { recipe });
})

app.put('/recipes/:id', async (req, res) => {
    const { id } = req.params;
    const recipe = await Item.findByIdAndUpdate(id, { ...req.body.recipe });
    res.redirect(`/recipes/${recipe._id}`)
});

app.get('/recipes/:id/ingredients/new', (req, res) => {
    const { id } = req.params;
    res.render('ingredients/new', { id });
})

app.post('/ingredients/:id/new', async (req, res) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    const {name, description, quantity, quantityType} = req.body.ingredient;
    const ingredient = new Ingredient({name, description, quantity, quantityType});
    recipe.ingredients.push(ingredient);
    ingredient.recipes.push(recipe);
    await recipe.save();
    await ingredient.save();
    res.send(recipe);
    // await ingredient.save();
    // res.send(ingredient1);
})

// !!!!!---------------------------------------------------------------!!!!!!!!!!!!!!!!
//                             Ingriedient routes


app.get('/ingredients', async (req, res) => {
    const ingredients = await Ingredient.find({});
    res.render('ingredients/index', { ingredients });
})
app.get('/ingredients/new', (req, res) => {
    res.render('ingredients/new');
})

app.post('/ingredients/new', async (req, res) => {
    const ingredient = new Ingredient(req.body.ingredient);
    await ingredient.save();
    console.log("it worked" + ingredient.name);
})


app.listen(3000, () => {
    console.log('Serving on port 3000')
})