const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const db = require('../models/db');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(new ApiError(401, 'Access token required'));
    }

    jwt.verify(token, config.jwtSecret, async (err, decodedUser) => {
        if (err) {
            return next(new ApiError(403, 'Invalid or expired token'));
        }
        try {
            const result = await db.query('SELECT status, role, first_name, last_name FROM users WHERE id = $1', [decodedUser.id]);
            if (result.rows.length === 0) {
                return next(new ApiError(401, 'User no longer exists'));
            }
            const user = result.rows[0];
            if (user.status === 'blocked') {
                return next(new ApiError(403, 'Your account has been blocked by the Administrator'));
            }
            if (user.status === 'frozen') {
                return next(new ApiError(403, 'Your account has been frozen by the Administrator'));
            }
            req.user = {
                id: decodedUser.id,
                email: decodedUser.email,
                role: user.role,
                name: `${user.first_name} ${user.last_name}`,
                status: user.status
            };
            next();
        } catch (dbErr) {
            next(dbErr);
        }
    });
};
