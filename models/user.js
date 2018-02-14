var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Mongoose promises are depricated use global
mongoose.Promise = global.Promise;

var UserSchema = new Schema({
    firstName: {
        type: String,
        max: [100, 'First name is limited to 100 characters'],
        required: [true, 'First name is required']
    },
    lastName: {
        type: String,
        max: [100, 'Last name is limited to 100 characters'],
        required: [true, 'Last name is required']
    },
    email: {
        type: String,
        max: [200, 'Email is limited to 200 characters'],
        required: [true, 'Email address is required'],
        unique: [true, 'Email address must be unique']
    },
    password: {
        type: String,
        max: [72, 'Encrypted password is limited to 72 characters'],
        required: [true, 'Pasword is required']
    },
    search: {
        type: String,
        max: [72, 'Search term is limited to 72 characters'],
        default: ""
    },
    venues: [],    

}, {
    versionKey: false
});

module.exports = mongoose.model('User', UserSchema);
