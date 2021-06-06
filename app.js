const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const Item = require('./models/item');

const items = require('./routes/items');
const recipes = require('./routes/recipes');
const ingredients = require('./routes/ingredients');

const catchAsync = require('./utils/catchAsync');

mongoose.connect('mongodb://localhost:27017/barcode', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
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
app.use('/recipes', recipes);
app.use('/ingredients', ingredients);
app.use(express.static(path.join(__dirname, 'public')));

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

app.use((err, req, res, next) => {
    const {statusCode = 500, message = "something went wrong"} = err;
    if(!err.message) err.message = 'Oh No! something went wrong!';
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})