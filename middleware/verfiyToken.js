const jwt = require('jsonwebtoken');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];

    if (!authHeader) {
        const error = appError.create('Token is required', 401, httpStatusText.ERROR);
        return next(error);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        const error = appError.create('Token is malformed', 401, httpStatusText.ERROR);
        return next(error);
    }

    try {
        // Decode the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Ensure the same secret used during token creation

        // Attach the decoded information (including user_id) to req.currentUser
        req.currentUser = decoded; // decoded contains { user_id, email, role }

        next(); // Move to the next middleware or route handler
    } catch (err) {
        const error = appError.create('Invalid or expired token', 401, httpStatusText.ERROR);
        return next(error);
    }
};

module.exports = verifyToken;
