const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createProxyMiddleware } = require('http-proxy-middleware');
const db = require('../models/db');

const proxyLogger = async (req, res, next) => {
    if (req.user && req.method !== 'GET') {
        try {
            const action = `${req.method} ${req.originalUrl}`;
            let details = '';
            if (req.body) {
                const bodyCopy = { ...req.body };
                if (bodyCopy.password) bodyCopy.password = '***';
                details = JSON.stringify(bodyCopy);
            }
            await db.query(
                'INSERT INTO activity_logs (user_id, email, role, action, details) VALUES ($1, $2, $3, $4, $5)',
                [req.user.id, req.user.email, req.user.role, action, details]
            );
        } catch (err) {
            console.error('Failed to log proxy activity:', err.message);
        }
    }
    next();
};

const setupProxy = (path, targetEnv) => {
    const target = process.env[targetEnv] || 'http://localhost:8080';
    router.use(path, authMiddleware, proxyLogger, createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (pathStr) => {
            return pathStr.replace(path, '');
        },
        onProxyReq: (proxyReq, req) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.id.toString());
                proxyReq.setHeader('X-User-Role', req.user.role);
                proxyReq.setHeader('X-User-Email', req.user.email);
                proxyReq.setHeader('X-User-Name', encodeURIComponent(req.user.name));
            }
            if (req.body && req.method !== 'GET') {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res) => {
            console.error(`Proxy error at ${path} -> ${target}:`, err.message);
            res.status(502).json({ error: `Service temporarily unavailable (${path})` });
        }
    }));
};

setupProxy('/api/academics', 'ACADEMIC_SERVICE_URL');
setupProxy('/api/schedule', 'SCHEDULING_SERVICE_URL');
setupProxy('/api/library', 'LIBRARY_SERVICE_URL');
setupProxy('/api/finance', 'FINANCE_SERVICE_URL');
setupProxy('/api/inventory', 'INVENTORY_SERVICE_URL');
setupProxy('/api/cafe', 'CAFE_SERVICE_URL');
setupProxy('/api/assignments', 'ASSIGNMENT_QUIZ_SERVICE_URL');
setupProxy('/api/quizzes', 'ASSIGNMENT_QUIZ_SERVICE_URL');
setupProxy('/api/research', 'RESEARCH_LAB_SERVICE_URL');
setupProxy('/api/labs', 'RESEARCH_LAB_SERVICE_URL');
setupProxy('/api/parking', 'PARKING_ALUMNI_SERVICE_URL');
setupProxy('/api/alumni', 'PARKING_ALUMNI_SERVICE_URL');
setupProxy('/api/reports', 'REPORT_SERVICE_URL');

module.exports = router;
