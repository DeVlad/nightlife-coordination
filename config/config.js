// Configuration

module.exports = {    
    api: {
        url: process.env.API_URL,
        client_id: process.env.API_ID,
        client_secret: process.env.API_KEY,
        v: 20180101,
        query: "bar",
        limit: 10
    },
    picture: {
        defaultVenuePicture: "/img/default.png",
        resolution: "320x240"
    },
    cdn: {
        jQuery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
        bootstrap: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
        bootstrapCss: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
        jQueryValidate: 'https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.17.0/jquery.validate.min.js'
    }
};
