var express = require('express'),
    app = express(),
    port = process.env.PORT || 8000;

var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var exphbs = require('express-handlebars');
var flash = require('connect-flash');
var mongoose = require('mongoose');

// Database
var db = mongoose.connection;
var uri = 'mongodb://localhost/nightlife';
var options = {
    autoReconnect: true,
    keepAlive: 1,
    connectTimeoutMS: 30000
};

db.on('connecting', function () {
    console.log('Connecting to:', uri);
});

db.on('connected', function () {
    console.log('Database connection established.');
});

db.on('error', function () {
    console.error('Database connection failed!');
    mongoose.disconnect();
});

db.on('disconnected', function () {
    console.log('Disconnected from:', uri);
    mongoose.connect(uri, options);
});

db.on('reconnected', function () {
    console.log('Reconnected to database.');
});

mongoose.connect(uri, options);

// Passport Auth
require('./config/passport')(passport);

// Read cookies
app.use(cookieParser());

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// View engine
app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'layout',
    partialsDir: __dirname + '/views/partials/'
}));
app.set('view engine', '.hbs');

// Required for passport
app.use(session({
    secret: 'ItsVerySecret.ChangeAndStoreItInEnvVariableInProduction!',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());

// Persistent login sessions
app.use(passport.session());

// Flash messages stored in session
app.use(flash());

// Handle static files
app.use(express.static(__dirname + '/public'));

// Routes
require('./routes/routes.js')(app, passport);

// Error handler
app.use(function (err, req, res, next) {
    // if URIError occurs
    if (err instanceof URIError) {
        err.message = 'Failed to decode param at: ' + req.url;
        err.status = err.statusCode = 400;
        return res.send('Error: ' + err.status + '<br>' + err.message);
    } else {
        // More errors...
    }
});

app.listen(port, console.log('Web server is listening on port:', port));
