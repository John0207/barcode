const mongoose = require('mongoose');
const Item = require('../models/item');
const Ingredient = require('../models/ingredient');
const Recipe = require('../models/recipe');
const ingredients = require('./ingredients');
const items = require('./items');
const recipes = require('./recipes');




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

const seedDB = async () => {
    await Item.deleteMany({});
    await Ingredient.deleteMany({});
    await Recipe.deleteMany({});
    for (let i = 0; i < items.length; i++) {      
        
        const item = new Item({
            title: `${items[i].title}`,
            upc: `${items[i].upc}`,    
            quantity: `${items[i].quantity}`,    
            quantityType: `${items[i].quantityType}`,    
            price: `${items[i].price}`,   
            location: `${items[i].location}`,   
            caseQty: `${items[i].caseQty}`,   
            date: `${items[i].date}`,
            shelfLife: `${items[i].shelfLife}`,
            date_purchased_ISO: `${items[i].date}`,
            expiration_date: `${items[i].expiration_date}`            
        });

        await item.save();   
    }
    for (let i = 0; i < ingredients.length; i++) {      
        
        const ingredient = new Ingredient({
            name: `${ingredients[i].name}`,
            description: `${ingredients[i].description}`,    
            quantity: `${ingredients[i].quantity}`,    
            quantityType: `${ingredients[i].quantityType}`,  
        });

        await ingredient.save();   
    }

    for (let i = 0; i < recipes.length; i++) {      
        
        const recipe = new Recipe({
            name: `${recipes[i].name}`,
            recipe: `${recipes[i].recipe}`,    
            minTime: `${recipes[i].minTime}`,    
            maxTime: `${recipes[i].maxTime}`,  
        });

        await recipe.save();   
    }
    
    

}

// const updateWithItems = async () => {
//     const ingredients = await Ingredient.find({});
//     const recipes = await Recipe.find({});
//     const ingredient = ingredients.find(x => x.name = 'lemons');
//     const recipe = recipes.find(x => x.name === "lemon chicken");
//     const recipeName = recipes.find(x => x.name = 'lemon chicken').name;
//     console.log(recipe.ingredients);
//     console.log(ingredient);
//     recipe.ingredients.push(ingredient);
//     console.log(recipe);
//     // const { recipe_lemon_chicken } = await Recipe.find({name: 'lemon chicken'});
//     // console.log("name of lemons: " + lemons.name + " recipe ingriedients: " + recipe_lemon_chicken.ingredients);
//     // await Recipe.findOneAndUpdate({name: recipe_lemon_chicken.name}, {ingredients: recipe_lemon_chicken._id});
//     // console.log(recipe_lemon_chicken);    
// }

seedDB().then(() => {
    mongoose.connection.close();
});

// updateWithItems();





