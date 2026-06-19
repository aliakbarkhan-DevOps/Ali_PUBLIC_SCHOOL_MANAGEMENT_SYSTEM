const db = require('../models/db');
const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res, next) => {
    const { email, password, role, firstName, lastName, profileDetails } = req.body;
    const passwordHash = await authService.hashPassword(password);
    
    try {
        const result = await db.query(
            'INSERT INTO users (email, password_hash, role, first_name, last_name, profile_details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
            [email, passwordHash, role, firstName, lastName, JSON.stringify(profileDetails || {})]
        );
        res.status(201).json({ user: result.rows[0], message: 'User registered successfully' });
    } catch (err) {
        if (err.code === '23505') {
            return next(new ApiError(400, 'User with this email already exists'));
        }
        return next(err);
    }
});

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        return next(new ApiError(401, 'Invalid email or password'));
    }

    const user = result.rows[0];
    if (user.status === 'blocked') {
        return next(new ApiError(403, 'Your account has been blocked by the Administrator'));
    }
    if (user.status === 'frozen') {
        return next(new ApiError(403, 'Your account has been frozen by the Administrator'));
    }

    const match = await authService.comparePassword(password, user.password_hash);
    if (!match) {
        return next(new ApiError(401, 'Invalid email or password'));
    }

    // Log activity
    await db.query(
        'INSERT INTO activity_logs (user_id, email, role, action, details) VALUES ($1, $2, $3, $4, $5)',
        [user.id, user.email, user.role, 'Login', 'User logged in successfully']
    );

    const token = authService.generateToken(user);
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            imageUrl: user.image_url,
            profileDetails: user.profile_details,
        }
    });
});

exports.getProfile = asyncHandler(async (req, res, next) => {
    const result = await db.query('SELECT id, email, role, first_name, last_name, profile_details, image_url, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
        return next(new ApiError(404, 'User not found'));
    }
    const user = result.rows[0];
    res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        imageUrl: user.image_url,
        profileDetails: user.profile_details,
        createdAt: user.created_at
    });
});
