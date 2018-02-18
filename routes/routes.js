var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var ajax = require('axios');
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
var Venue = require('../models/venue');

// API
if (!process.env.API_URL || (!process.env.API_ID) || (!process.env.API_KEY)) {
    console.log('WARNING: Please export API credentials as environment variables !');
} else {
    var config = require('../config/config');
    var apiQuery = buildUrl(config);
}

module.exports = function (app, passport) {

    app.get('/', function (req, res) {
        res.render('index');
    });

    app.get('/search', function (req, res) {
        res.render('search');
    });

    app.post('/search', function (req, res) {
        if (!apiQuery) {
            console.log('WARNING: Please export API credentials as environment variables !');
            return res.send('ERROR: No API credentials exported !');
        } else {
            var apiResponse = {};
            // TODO: Sanitaze user input
            if (req.isAuthenticated()) {
                saveLastSearch(req.user._id, req.body.search);
            }

            ajax.get(apiQuery + 'near=' + req.body.search).then(response => {
                // Success
                apiResponse = response.data.response;

            }).then(() => {
                // Render results page                
                res.render('search', {
                    result: apiResponse,
                    searched: req.body.search
                });

            }).catch(error => {
                //console.log(error);
                //return res.send('Error fetching API data');
                // venue not found
                res.render('search', {
                    message: 'No venues found !',
                    searched: req.body.search
                });
            });
        }
    });

    // Latest venue search
    app.get('/last', function (req, res) {
        if (req.isAuthenticated() && req.user.search !== undefined && req.user.search.length > 0) {
            var lastSearch = req.user.search;
            var apiResponse = {};

            ajax.get(apiQuery + 'near=' + lastSearch).then(response => {
                apiResponse = response.data.response;
            }).then(() => {
                res.render('search', {
                    result: apiResponse,
                    searched: lastSearch
                });
            }).catch(error => {
                res.render('search');
            });
        } else {
            res.render('search');
        }
    });

    // Fetch venue picture
    app.post('/venue/picture/:vid', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = "https://api.foursquare.com/v2/venues/" + venueId + "?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;

        ajax.get(venueUrl).then(response => {
            if (response.data.response.venue.bestPhoto) {
                var pictureUrl = response.data.response.venue.bestPhoto.prefix + config.picture.resolution + response.data.response.venue.bestPhoto.suffix;
                var jsonResponse = {
                    url: pictureUrl
                };
            } else { // Picture not found
                var jsonResponse = {
                    url: config.picture.defaultVenuePicture
                };
            }
            res.send(jsonResponse);

        }).catch(error => {
            //console.log(error);
            var jsonResponse = {
                url: config.picture.defaultVenuePicture
            };
            return res.send(jsonResponse);
        });
    });

    // Fetch all venue pictures
    app.post('/venue/pictures/:vid', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = "https://api.foursquare.com/v2/venues/" + venueId + "/photos?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;

        ajax.get(venueUrl).then(response => {
            if (response.data.response.photos.count > 0) {
                var apiPhotos = response.data.response.photos.items;
                var photoUrls = [];
                for (var photo of apiPhotos) {
                    photoUrls.push(photo.prefix + photo.width + 'x' + photo.height + photo.suffix);
                    //photoUrls.push(photo.prefix +  config.picture.resolution + photo.suffix);
                }

                var jsonResponse = {
                    pictures: photoUrls
                };
            } else { // Picture not found
                var jsonResponse = {
                    pictures: [config.picture.defaultVenuePicture]
                };
            }
            res.send(jsonResponse);

        }).catch(error => {
            var jsonResponse = {
                pictures: [config.picture.defaultVenuePicture]
            };
            return res.send(jsonResponse);
        });
    });

    app.get('/venue/:vid', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = "https://api.foursquare.com/v2/venues/" + venueId + "?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;
        var apiResponse = {};

        ajax.get(venueUrl).then(response => {
            apiResponse = response.data.response.venue;
            //console.log(apiResponse);

        }).then(() => {
            // Render results page
            res.render('venue', {
                venue: apiResponse,
            });

        }).catch(error => {
            //console.log(error);
            return res.send('Error fetching API data');
        });

    });

    // Visitors count
    //TODO: Only for authenticated users, use database
    app.get('/venue/:vid/visitors', function (req, res) {
        var venueId = req.params.vid;
        //console.log(venueId);
        var jsonResponse = {
            "vid": venueId,
            "count": 0
        };

        Venue.find({vid: venueId}, function (err, venue) {
            //console.log("GET: Find venue: ", venueId, venue);
            if (err) throw err;
            if (venue[0] === undefined) { //Venue not found in database
                res.send(jsonResponse);
            } else {
                jsonResponse = {
                    "vid": venueId,
                    "count": venue[0].visitors.length
                };
                res.send(jsonResponse);
            }
        });
    });

    app.post('/venue/:vid/visitors', isLoggedIn, function (req, res) {
        var venueId = req.params.vid;
        var userId = req.user._id.toString();

        Venue.find({vid: venueId}, function (err, venue) {
            //console.log("POST: Find venue: ", venueId, venue);
            if (err) throw err; 
            if (venue.length > 0) { // Venue exist in db
                //console.log('Venue exist in database', venue);                
                if(venue[0].visitors.indexOf(userId) > -1) {
                    //console.log("Visitor exist"); // Visitor exist. Remove user from venue.
                    var visitors = venue[0].visitors.filter(function(user) {
                        return user !== userId;
                    });                    
                    var updateVenue = {                    
                        visitors: visitors
                    };                    
                    var jsonResponse = {
                        "vid": venueId,
                        "count": visitors.length
                    };
                    
                    Venue.update({_id: venue[0]._id}, updateVenue, function (err) {
                        if (err) throw err;                        
                        console.log('Venue visitor successfully updated!');
                    });
                    
                    res.send(jsonResponse);
                    
                } else {
                    //console.log("Venue exist, user not exist", venue[0].visitors)
                    var visitors = venue[0].visitors;
                    visitors.push(userId);
                    //console.log("visitors", visitors)
                    var updateVenue = {                    
                        visitors: visitors
                    };
                    var jsonResponse = {
                        "vid": venueId,
                        "count": updateVenue.visitors.length
                    };
                    
                    Venue.update({_id: venue[0]._id}, updateVenue, function (err) {
                        if (err) throw err;
                        console.log('Venue visitor successfully updated!');
                    });
                
                    res.send(jsonResponse);
                }
                
            } else { // Save venue visitor
                //console.log("Venue not exist")
                var venue = new Venue({
                    vid: venueId,
                    visitors: [userId]
                });
                var jsonResponse = {
                        "vid": venueId,
                        "count": 1
                };
                
                venue.save(function (err) {
                    if (err) throw err;
                    console.log('Venue visitor successfully saved!');
                });

                res.send(jsonResponse);
            }
        });
    });

    app.get('/login', function (req, res) {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    app.post('/login', passport.authenticate('local-login', {
            failureRedirect: '/login',
            successRedirect: '/last',
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

// Save search term to user account
function saveLastSearch(userId, searchTerm) {
    User.findById(userId, function (err, user) {
        if (err) throw err;
        user.search = searchTerm;
        user.save(function (err) {
            if (err) throw err;
            //console.log('Search term successfully updated!');
        });
    });
}
