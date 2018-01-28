// Configuration

module.exports = {
    baseUrl: "http://localhost:8000/",
    api: {
        url: process.env.API_URL,
        client_id: process.env.API_ID,
        client_secret: process.env.API_KEY,
        v: 20180101,
        query: "bar",
        near: "",
        limit: 10
    }
};
