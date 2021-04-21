const mongoose = require('mongoose');
const Item = require('../models/item');
const items = require('./items');

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
    for (let i = 0; i < items.length; i++) {
        const item = new Item({
            title: `${items[i].title}`,
            upc: `${items[i].upc}`,    
            quantity: `${items[i].quantity}`,    
            price: `${items[i].price}`,   
            location: `${items[i].location}`,   
            caseQty: `${items[i].caseQty}`,   
            date: `${items[i].date}`,
            date_purchased_ISO: `${items[i].date}` 
            
        })
        await item.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})


