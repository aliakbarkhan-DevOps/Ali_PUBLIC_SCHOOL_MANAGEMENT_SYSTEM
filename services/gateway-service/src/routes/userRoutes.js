const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
};

const adminOrCafeMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'cafe_operator')) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden. Admin or Cafe Operator access required.' });
    }
};

// Admin user management routes
router.get('/', authMiddleware, adminOrCafeMiddleware, userController.getUsers);
router.post('/', authMiddleware, adminMiddleware, userController.createUser);
router.put('/:id/status', authMiddleware, adminMiddleware, userController.updateUserStatus);
router.put('/:id/image', authMiddleware, adminMiddleware, userController.uploadUserImage);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

// Attendance routes
router.post('/attendance', authMiddleware, userController.checkinAttendance);
router.get('/attendance/today', authMiddleware, userController.getUserTodayAttendance);
router.get('/attendance', authMiddleware, adminMiddleware, userController.getAllAttendance);

// Admin auditing routes
router.get('/activities', authMiddleware, adminMiddleware, userController.getActivityLogs);

module.exports = router;
