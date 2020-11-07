const express = require('express');
const request = require('request');
const rateLimit = require("express-rate-limit");

module.exports = function() {
    const app = express();

    const hourLimiter = rateLimit({
        message: "The Cheeto in Chief has already tweeted this hour.",
        windowMs: 1000 * 60 * 60,
        max: 1,
        keyGenerator: function(req /*, res*/) {
            return req.path;
        },
    });
    const dayLimiter = rateLimit({
        message: "The Cheeto in Chief has already tweeted his max tweets today.",
        windowMs: 1000 * 60 * 60 * 24,
        max: 6,
        keyGenerator: function(req /*, res*/) {
            return req.path;
        },
    });
    app.use("/trump", hourLimiter);
    app.use("/trump", dayLimiter);
    app.post('/trump', (req, res) => {

        req.on("data", function (raw) {
            let data = JSON.parse(raw.toString());
            let options = {
                uri: "https://discordapp.com/api/webhooks/637462610866077716/FhKHWUbJBxN_AtaRg6A9jmRgAWOPNeMmuD7DFYsq1X34bbslBs3aW_mJp14GK5ihaJ5H",
                method: "POST",
                json: data
            };
            request(options, function (error, response, body) {
            });
        });
        return res.send("DONE");
    });
    return app;
};