var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var ajax = require('axios');
var form = require('express-form2'),
    filter = form.filter,
    field = form.field,
    validate = form.validate;
var app = express();
var fs = require('fs');
var Console = require('console');

var User = require('../models/user');
var Venue = require('../models/venue');
var time = require('../lib/timestamp');

// Log
var infoLog = fs.createWriteStream('./log/info.log', {'flags': 'a'});
var secureLog = fs.createWriteStream('./log/secure.log', {'flags': 'a'});
var errorLog = fs.createWriteStream('./log/error.log', {'flags': 'a'});
var info = new console.Console(infoLog);
var secure = new console.Console(secureLog);
var error = new console.Console(errorLog);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// API
if (!process.env.API_URL || (!process.env.API_ID) || (!process.env.API_KEY)) {
    console.log('WARNING: Please export API credentials as environment variables !');
    error.log(time.timestamp(), 'WARNING: Please export API credentials as environment variables !');    
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
            secure.log(time.timestamp(), 'WARNING: Please export API credentials as environment variables !');
            return res.send('ERROR: No API credentials exported !');
        } else {
            // Empty search
            if (req.body.search.length == 0) {
                return res.render('search', {
                    message: 'Empty search ! Please enter some text !',
                    searched: req.body.search
                });
            }
            
            var apiResponse = {};
            var searchTerm = req.body.search;
            searchTerm = searchTerm.trim().replace(/[_/\\#$;|"?<>*(){}*@^.:!%&[\]`~=+]/g, ''); // Sanitaze user input
            //console.log(searchTerm);
            if (req.isAuthenticated()) {
                saveLastSearch(req.user._id, searchTerm);
            }

            ajax.get(apiQuery + 'near=' + searchTerm).then(function (response) {
                // Success
                apiResponse = response.data.response;

            }).then(function () {
                // Render results page
                res.render('search', {
                    result: apiResponse,
                    searched: searchTerm
                });

            }).catch(function (error) {
                // Venue not found
                res.render('search', {
                    message: 'No venues found !',
                    searched: searchTerm
                });
            });
        }
    });

    // Latest venue search
    app.get('/last', function (req, res) {
        if (req.isAuthenticated() && req.user.search !== undefined && req.user.search.length > 0) {
            var lastSearch = req.user.search;
            var apiResponse = {};

            ajax.get(apiQuery + 'near=' + lastSearch).then(function (response) {
                apiResponse = response.data.response;
            }).then(function () {
                res.render('search', {
                    result: apiResponse,
                    searched: lastSearch
                });
            }).catch(function (error) {
                res.render('search');
            });
        } else {
            res.render('search');
        }
    });

    // Fetch venue picture
    app.post('/venue/picture/:vid', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = config.api.url + venueId + "?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;

        ajax.get(venueUrl).then(function (response) {
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

        }).catch(function (error) {
            var jsonResponse = {
                url: config.picture.defaultVenuePicture
            };
            return res.send(jsonResponse);
        });
    });

    // Fetch all venue pictures
    app.post('/venue/pictures/:vid', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = config.api.url + venueId + "/photos?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;

        ajax.get(venueUrl).then(function (response) {
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

        }).catch(function (error) {
            var jsonResponse = {
                pictures: [config.picture.defaultVenuePicture]
            };
            return res.send(jsonResponse);
        });
    });
    
    // Venue details page
    app.get('/venue/:vid', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = config.api.url + venueId + "?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;
        var apiResponse = {};

        ajax.get(venueUrl).then(function (response) {
            apiResponse = response.data.response.venue;
        }).then(function () {
            // Render results page
            res.render('venue', {
                venue: apiResponse,
            });

        }).catch(function (error) {
            //console.log(error);
            return res.send('Error fetching API data');
        });
    });
    
    // Return venue data in json format. TODO: only for auth users.
    app.get('/venue/:vid/json', function (req, res) {
        var venueId = req.params.vid;
        var venueUrl = config.api.url + venueId + "?client_id=" + config.api.client_id + "&client_secret=" + config.api.client_secret + "&v=" + config.api.v;
        var apiResponse = {};

        ajax.get(venueUrl).then(function (response) {
            apiResponse = response.data.response.venue;           

        }).then(function () {
            // Render results page
            res.send({ venue: apiResponse });

        }).catch(function (error) {
            //console.log(error);
            return res.send({venue: false});
        });
    });

    // Visitors count    
    app.get('/venue/:vid/visitors', isLoggedIn, function (req, res) {
        var venueId = req.params.vid;        
        var jsonResponse = {
            "vid": venueId,
            "count": 0
        };

        Venue.find({vid: venueId}, function (err, venue) {
            if (err) throw err;
            if (venue[0] === undefined) { // Venue not found in database
                res.send(jsonResponse);
            } else {                
                jsonResponse = {
                    "vid": venueId,
                    "count": venue[0].visitors.length,
                    "visitors": venue[0].visitors
                };
                res.send(jsonResponse);
            }
        });
    });

    app.post('/venue/:vid/visitors', isLoggedIn, function (req, res) {
        var venueId = req.params.vid;
        var userId = req.user._id.toString();

        Venue.find({vid: venueId}, function (err, venue) {            
            if (err) throw err; 
            if (venue.length > 0) { // Venue exist in db                
                if(venue[0].visitors.indexOf(userId) > -1) { // Visitor exist. Remove user from venue. 
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
                    });
                    
                    res.send(jsonResponse);
                    
                } else { // Venue exist, user not exist
                    var visitors = venue[0].visitors;
                    visitors.push(userId);
                    
                    var updateVenue = {                    
                        visitors: visitors
                    };
                    var jsonResponse = {
                        "vid": venueId,
                        "count": updateVenue.visitors.length
                    };
                    
                    Venue.update({_id: venue[0]._id}, updateVenue, function (err) {
                        if (err) throw err;                        
                    });
                
                    res.send(jsonResponse);
                }
                
            } else { // Venue not exist. Save venue and visitor.
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
                });

                res.send(jsonResponse);
            }
        });
    });    
    
    app.get('/user/:id', isLoggedIn, function (req, res) {
        var userId = req.params.id;
        var objectId = User.toObjectId(userId); // Convert string id to mongo object id
        var jsonResponse = {"username": false};
        
        if(!objectId) { // Invalid object id string
            res.send(jsonResponse);
        } else {
            User.find({_id: objectId}, function (err, user) {
                if (err) throw err;
                if (user[0] === undefined) { // User not found in database
                    res.send(jsonResponse);
                } else {
                    var names = user[0].firstName + ' ' + user[0].lastName;
                    jsonResponse = {
                        "username": names
                    };
                    res.send(jsonResponse);
                }
            });
        }
    });
    
    // Get list of venues the user will visit.
    app.get('/user/:id/venues', isLoggedIn, function (req, res) {
        // TODO: validate if user ins current logged user
        var userId = req.params.id;
        var jsonResponse = {"venues": false};        
        
        Venue.find({ visitors: { "$in" : [userId] } }, {"visitors": 0, _id: 0}, function (err, venues) {     
                if (err) throw err;
                if (venues[0] === undefined) { // User not found in venues
                    res.render('user-venues', jsonResponse);
                } else { // found in venues
                    jsonResponse = {
                        "venues": venues
                    };
                    res.render('user-venues', jsonResponse);
                }
            });
    });
    
    // Delete user
    app.delete('/user/:id/', isLoggedIn, function (req, res) {   
        var userId = req.params.id;
        var jsonResponse = {"deleted": false};
        
        if(userId !== req.user.id) { // ensure the user can delete only himself
            console.log('WARNING: User with id: ' + req.user.id + 'is trying to delete user id: ' + req.params.id + ' !');
            secure.log(time.timestamp(), 'WARNING: User with id: ' + req.user.id + 'is trying to delete user id: ' + req.params.id + ' !' );
            jsonResponse.message = 'Error ! Please contact the support team';
            res.send(jsonResponse);
        } else {            
            // Remove user from all venues before account removal
            Venue.update({ visitors: { "$in" : [userId] }}, { $pullAll: {visitors: [userId] }}, {"multi": true}, function (err, venues) {
                if (err) throw err;
                /*if (venues.nModified === 0) { // User not found in venues
                    console.log("DELETE: User not found in any venue.");
                }*/
                // Account delete
                var objectId = User.toObjectId(userId);
                        
                User.remove({ "_id": objectId }, function (err, user) {
                    if(err) throw err;
                    console.log("DELETE: User id: " + userId + " is removed from database !");
                    info.log(time.timestamp(), "DELETE: User id: " + userId + " is removed from database !");
                    jsonResponse = {                        
                        "deleted": true,
                        "message": "Your account has been deleted successfully!"
                    }
                    
                    res.send(jsonResponse);
                    });          
            });
        }    
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
                res.redirect('/signup');
            } else {
                passport.authenticate('local-signup', {
                    successRedirect: '/profile',
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
    
    // Change user password
    app.put('/user/:id/:password/:npassword', isLoggedIn, function (req, res) {                       
            var userId = req.params.id;
            var jsonResponse = {"changed": false};
            var objectId = User.toObjectId(userId);
        
            if(userId !== req.user.id) { // ensure the user can change only his own password
                console.log('WARNING: User with id: ' + req.user.id + 'is trying to change password of user id: ' + req.params.id + ' !');
                secure.log(time.timestamp(), 'WARNING: User with id: ' + req.user.id + 'is trying to change password of user id: ' + req.params.id + ' !');
                jsonResponse.message = 'Error! Please contact the support team!';
                return res.send(jsonResponse);
            }        
            if(objectId === false) {
                console.log('WARNING: Invalid object id in password change attempt');
                secure.log(time.timestamp(), 'WARNING: Invalid object id in password change attempt!');
                jsonResponse.message = 'Error! Please contact the support team!';
                
                return res.send(jsonResponse);
            } else {
                var oldPassword = req.params.password;
                var newPassword = req.params.npassword;
                var oldHash = req.user.password;
                var newHash;

                if (!bcrypt.compareSync(oldPassword, oldHash)) {
                    jsonResponse.message = 'The current password is wrong!';
                    return res.send(jsonResponse);
                } else {
                    newHash = bcrypt.hashSync(newPassword, null, null);
                    var newCredentials = {
                        password: newHash
                    };
                    // Save new hashed password
                    User.update({_id: objectId}, newCredentials, function (err) {
                        if (err) throw err;
                        jsonResponse.changed = true;
                        jsonResponse.message = 'Your password has been changed successfully!';
                        secure.log(time.timestamp(), 'INFO: User id ' + userId + ' changed his password.');
                                   
                        res.send(jsonResponse);
                    });
                }
            }            
});
    

    // Return 404 on missing pages
    app.get('*', function (req, res) {
        res.status(404).send('Error: 404. Page not found !');
    });
};

// Is authenticated policy
// Make sure the user is logged
function isLoggedIn(req, res, next) {    
    if (req.isAuthenticated())
        return next();    
    res.redirect('/');
}

// Build url query for the API
function buildUrl(config) {
    var query = '';
    var position = 0;
    for (var param in config.api) {
        if (position === 0) {
            query += Object.values(config.api)[position] + 'search?';
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
        });
    });
}
