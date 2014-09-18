'use strict';

var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, callback) {
            User.findOne({
                email: email.toLowerCase()
            }, function(err, user) {
                if (err) return callback(err);

                // no user found with that email
                if (!user) {
                    return callback(null, false, { message: 'This email is not registered.' });
                }
                // make sure the password is correct
                user.comparePassword(password, function(err, isMatch) {
                    if (err) { return callback(err); }

                    // password did not match
                    if (!isMatch) {
                        return callback(null, false, { message: 'This password is not correct.' });
                    }

                    // success
                    return callback(null, user);
                });
            });
        }
    ));
};
