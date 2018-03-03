var Venue = require('../models/venue');
var cron = require('node-cron');

// Purge empty venues from database
// At 04:00 on Sunday. - '0 4 * * 0' - Prod
// At 23:30 - '30 23 * * *' - Dev

var deleteVenuesWithoutVisitors = cron.schedule('30 23 * * *', function () {
    Venue.remove({
            visitors: {
                $size: 0
            }
        },
        function (err, venue) {
            if (err) {
                console.log("CRON: Delete venues without visitors failed!");
                throw err;
            }
            console.log("CRON: Deleted venues without visitors:", venue.n);
        });
});
