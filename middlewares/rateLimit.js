const rateLimit = require('express-rate-limit');

const geocodingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many geocoding requests from this IP, please try again after 15 minutes'
});

module.exports = { geocodingLimiter };