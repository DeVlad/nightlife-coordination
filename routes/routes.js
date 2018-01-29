var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var form = require('express-form2'),
    filter = form.filter,
    field = form.field,
    validate = form.validate;
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

var User = require('../models/user');

// API
if (!process.env.API_URL || (!process.env.API_ID) || (!process.env.API_KEY)) {
    console.log('WARNING: Please export API credentials as environment variables');
} else {
    //console.log('API SETTINGS: OK');
    var config = require('../config/config');
    var apiQuery = buildUrl(config);
    //console.log(apiQuery);
}

module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        if (req.isAuthenticated()) {
            return res.render('index_auth');
        }        
        res.render('index');
    });

    app.post('/', function (req, res) {
        console.log('Query', apiQuery + req.body.search); // TODO: Sanitaze user input
        res.send(req.body.search);
    });

    app.get('/login', function (req, res) {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    app.post('/login', passport.authenticate('local-login', {
            failureRedirect: '/login',
            successRedirect: '/profile',
            failureFlash: true // Allow flash messages
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect('/');
        });

    app.get('/signup', function (req, res) {
        res.render('signup', {
            message: req.flash('signupMessage')
        });
    });

    app.post(
        '/signup',
        // Form filter and validation        
        form(
            field("firstName").trim().required().is(/^[A-z]+$/),
            field("lastName").trim().required().is(/^[A-z]+$/),
            field("password").trim().required().len(8, 72, "Password must be between 8 and 72 characters"),
            field("email").trim().required().isEmail(),
            validate("rpassword").equals("field::password")
        ),

        // Express request-handler now receives filtered and validated data 
        function (req, res) {
            // Additional validations            
            req.body.email = req.body.email.toLowerCase();

            if (!req.form.isValid) {
                // Handle errors 
                //console.log(req.form.errors);
                //TODO: flash messages
                res.redirect('/signup');

            } else {
                passport.authenticate('local-signup', {
                    successRedirect: '/login',
                    failureRedirect: '/signup',
                    failureFlash: true
                })(req, res);
            }
        }
    );

    app.get('/error', function (req, res) {
        res.render('error', {
            message: req.flash('errorMessage')
        });
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile', {
            user: req.user // get the user out of session and pass to template
        });
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // Return 404 on missing pages
    app.get('*', function (req, res) {
        res.status(404).send('Error: 404. Page not found !');
    });

};

// Is authenticated policy
// Make sure the user is logged
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if user is not logged redirect to home page
    res.redirect('/');
}

// Build url query for the API
function buildUrl(config) {
    var query = '';
    var position = 0;
    for (var param in config.api) {
        if (position === 0) {
            query += Object.values(config.api)[position];
        } else {
            query += Object.keys(config.api)[position] + '=' + Object.values(config.api)[position] + '&';
        }
        position++;
    }
    //return query.slice(0, -1);
    return query;
}
