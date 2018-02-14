var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

var VenueSchema = new Schema({
    vid: {
        type: String,
    },
    visitors: [],

}, {
    versionKey: false
});

module.exports = mongoose.model('Venue', VenueSchema);
