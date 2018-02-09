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
    }
};
