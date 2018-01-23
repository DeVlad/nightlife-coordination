// Passport.js Authentication

var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (_id, done) {
        User.findById(_id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {
            //console.log("find user email in db: ", email);
            // if the user trying to login already exists
            User.findOne({
                'email': email
            }, function (err, user) {
                // if there are any errors, return the error
                //console.log("Find bt email: ", user);
                if (err)
                    return done(err);

                // already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    // no user with that email               
                    // create the user
                    /* var newUser = new User({
                         firstName: req.body.firstName,
                         lastName: req.body.lastName,
                         email: email,
                         password: bcrypt.hashSync(password, null, null)                       
                     });*/
                    newUser = new User();
                    newUser.firstName = req.body.firstName;
                    newUser.lastName = req.body.lastName;
                    newUser.email = email;
                    newUser.password = bcrypt.hashSync(password, null, null);
                    //console.log(newUser);

                    // save the user
                    newUser.save(function (err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        }));

    passport.use('local-login', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {
            User.findOne({
                'email': email
            }, function (err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);
                // if no user is found
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'User not found !'));
                // user is found but the password is wrong
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, req.flash('loginMessage', 'Wrong password !'));
                }
                // return successful user
                return done(null, user);
            });
        }));
};
