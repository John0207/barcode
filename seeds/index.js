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
            shelfLife: `${items[i].shelfLife}`,
            date_purchased_ISO: `${items[i].date}`,
            expiration_date: `${items[i].expiration_date}`            
        });

        await item.save();

        // await Item.findOneAndUpdate({title: `${items[i].title}`}, { date_purchased_ISO: `${items[i].date}`});
        // let date = new Date(`${items[i].date}`);
        // let exDate = new Date(date.setDate(date.getDate() + `${items[i].shelfLife}`));
        // await Item.findOneAndUpdate({title: `${items[i].title}`}, { expiration_date: exDate });
        // console.log(`${items[i].title}` + " is the title for this item");                
        // console.log(`${items[i].date}`);
        // console.log(exDate);
        
        
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})


