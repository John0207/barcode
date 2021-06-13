const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Item = require('./models/item');
const User = require('./models/user');

const itemRoutes = require('./routes/items');
const recipeRoutes = require('./routes/recipes');
const ingredientRoutes = require('./routes/ingredients');
const userRoutes = require('./routes/users');

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

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));


const sessionConfig = {
    secret: 'thishsouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        // 1 week
        HttpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/items', itemRoutes);
app.use('/recipes', recipeRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/', userRoutes);

app.locals.formatDate = (date) => {    
    let d = new Date(date),xxxx
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

app.get('/fakeUser', async(req, res) => {
    const user = new User({email: 'john123@gmail.com', username:'cooldude95'});
    const newUser = await User.register(user, 'chicken');
    res.send(newUser);
})


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
    const {statusCode = 500 } = err;
    if(!err.message) err.message = 'Oh No! something went wrong!';
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})