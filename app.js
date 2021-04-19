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
    res.render('items/index', { items })

})

app.get('/items/new', (req, res) => {
    res.render('items/new');
})

app.post('/items', async (req, res) => {
    const item = new Item(req.body.item);
    await item.save();
    res.redirect(`/items/${item._id}`);
})



app.get('/items/add-by-upc', async (req, res) => {
    res.render('items/add-by-upc');
})

app.post('/items/add-by-upc', async (req, res) => {
    const  upc1  = req.body.upc;
    const item = await Item.findOne({upc: upc1});
    console.log(item);
    res.send("Items name is: " + item.title);
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
})




app.listen(3000, () => {
    console.log('Serving on port 3000')
})