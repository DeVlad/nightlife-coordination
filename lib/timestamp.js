module.exports = {
    timestamp: function () {
        var options = {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        };
        var now = new Date();
        
        return now.toLocaleString("en-US", options).replace(/,/g, '');
    }
};
