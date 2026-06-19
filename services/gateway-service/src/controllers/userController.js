const db = require('../models/db');
const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');
const s3Service = require('../services/s3Service');

// Get all users
exports.getUsers = asyncHandler(async (req, res, next) => {
    const roleFilter = req.query.role;
    let queryStr = 'SELECT id, email, role, first_name AS "firstName", last_name AS "lastName", status, image_url AS "imageUrl", created_at AS "createdAt" FROM users';
    let params = [];
    if (roleFilter) {
        queryStr += ' WHERE role = $1';
        params.push(roleFilter);
    }
    queryStr += ' ORDER BY first_name, last_name';
    const result = await db.query(queryStr, params);
    res.json(result.rows);
});

// Admin registers user
exports.createUser = asyncHandler(async (req, res, next) => {
    const { email, password, role, firstName, lastName, profileDetails, image } = req.body;
    
    if (!email || !password || !role || !firstName || !lastName) {
        return next(new ApiError(400, 'Missing required fields'));
    }

    const passwordHash = await authService.hashPassword(password);
    
    try {
        const result = await db.query(
            'INSERT INTO users (email, password_hash, role, first_name, last_name, profile_details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
            [email, passwordHash, role, firstName, lastName, JSON.stringify(profileDetails || {})]
        );
        const newUser = result.rows[0];

        // Save image if present
        if (image) {
            try {
                const imageUrl = await s3Service.uploadUserAvatar(image, newUser.id);
                await db.query('UPDATE users SET image_url = $1 WHERE id = $2', [imageUrl, newUser.id]);
            } catch (imgErr) {
                console.error(`Failed to upload user image: ${imgErr.message}`);
            }
        }

        res.status(201).json({ user: newUser, message: 'User created successfully' });
    } catch (err) {
        if (err.code === '23505') {
            return next(new ApiError(400, 'User with this email already exists'));
        }
        return next(err);
    }
});

// Admin blocks or freezes user
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked', 'frozen'].includes(status)) {
        return next(new ApiError(400, 'Invalid status value'));
    }

    const result = await db.query(
        'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, email, status',
        [status, id]
    );

    if (result.rows.length === 0) {
        return next(new ApiError(404, 'User not found'));
    }

    res.json({ user: result.rows[0], message: `User status updated to ${status}` });
});

// Admin deletes user
exports.deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);

    if (result.rows.length === 0) {
        return next(new ApiError(404, 'User not found'));
    }

    res.json({ message: 'User deleted successfully', user: result.rows[0] });
});

// Get user activity logs
exports.getActivityLogs = asyncHandler(async (req, res, next) => {
    const result = await db.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500');
    res.json(result.rows);
});

// Mark daily attendance
exports.checkinAttendance = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    await db.query(
        `INSERT INTO daily_attendance (user_id, email, name, role, date, status) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (user_id, date) DO UPDATE SET status = EXCLUDED.status`,
        [req.user.id, req.user.email, req.user.name, req.user.role, today, status || 'present']
    );
    
    // Log activity
    await db.query(
        'INSERT INTO activity_logs (user_id, email, role, action, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, req.user.email, req.user.role, 'Mark Attendance', `Marked attendance for ${today} as ${status || 'present'}`]
    );
    
    res.json({ message: 'Attendance marked successfully' });
});

// Load user attendance status for today
exports.getUserTodayAttendance = asyncHandler(async (req, res, next) => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
        'SELECT status, checkin_time AS "checkinTime" FROM daily_attendance WHERE user_id = $1 AND date = $2',
        [req.user.id, today]
    );
    res.json(result.rows[0] || null);
});

// Load all attendance rosters
exports.getAllAttendance = asyncHandler(async (req, res, next) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const result = await db.query(
        'SELECT id, user_id AS "userId", email, name, role, date, status, checkin_time AS "checkinTime" FROM daily_attendance WHERE date = $1 ORDER BY checkin_time DESC',
        [date]
    );
    res.json(result.rows);
});

// Upload profile avatar
exports.uploadUserImage = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { image } = req.body; // Expects base64 string

    if (!image) {
        return next(new ApiError(400, 'Base64 image string is required'));
    }

    try {
        const imageUrl = await s3Service.uploadUserAvatar(image, id);
        const result = await db.query(
            'UPDATE users SET image_url = $1 WHERE id = $2 RETURNING id, email, image_url',
            [imageUrl, id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(404, 'User not found'));
        }

        // Log action
        await db.query(
            'INSERT INTO activity_logs (user_id, email, role, action, details) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, req.user.email, req.user.role, 'Upload Avatar', `Uploaded avatar for user ID ${id}`]
        );

        res.json({ message: 'Avatar image uploaded successfully', user: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});
