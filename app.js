const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Item = require('./models/item');
const methodOverride = require('method-override');

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

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/items', async (req, res) => {
    const items = await Item.find({});
    const allPrices = await Item.aggregate([{ $group: { _id : null,  "prices" : { $sum: { "$multiply" : ["$price", "$quantity"] }}}}]);
    const total = allPrices[0].prices;   
    const average = total / items.length;   
    console.log(total);
    console.log(average)
    res.render('items/index', { items, total, average });
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
    if (item) {
        await Item.findOneAndUpdate({upc: upc1}, { quantity: item.quantity - item.caseQty});
        console.log(item.title + " Successfully decremented");
        res.redirect("/items/decrement-by-upc");
    } else {
        res.render('items/new-upc', { upc1 });
    }
}) 

app.post('/items', async (req, res) => {
    const item = new Item(req.body.item);
    await item.save();
    res.redirect(`/items/${item._id}`);
})



app.get('/items/add-by-upc', (req, res) => {
    res.render('items/add-by-upc');
})

app.post('/items/add-by-upc', async (req, res) => {
    const  upc1  = req.body.upc;
    const item = await Item.findOne({upc: upc1});
    if (item) {
        await Item.findOneAndUpdate({upc: upc1}, { quantity: item.quantity + item.caseQty });
        console.log(item.title + " Successfully incremented");
        res.redirect("/items/add-by-upc");
    } else {
        res.render('items/new-upc', { upc1 });

        // FIX ERROR WHEN PAGE REFRESHES IT EXECUTES

        // add in flash alert and redirect to make a new item page

        // should prompt for all fields but only require title
        // should add location to item model
        // could also add date entered, good for expirations

        // could have page for unfinshed entries, could alert on home page, user could fix at their pace
        // find all items that have any undefined fields, set them
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




app.listen(3000, () => {
    console.log('Serving on port 3000')
})