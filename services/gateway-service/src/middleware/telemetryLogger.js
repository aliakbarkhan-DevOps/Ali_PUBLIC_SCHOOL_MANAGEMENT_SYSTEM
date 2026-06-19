const db = require('../models/db');

module.exports = (req, res, next) => {
    // Avoid logging telemetry calls themselves to prevent infinite logging loops
    if (req.originalUrl.startsWith('/api/devops')) {
        return next();
    }

    const startHrTime = process.hrtime();
    
    // Estimate payload size in bytes
    let payloadSize = 0;
    if (req.headers['content-length']) {
        payloadSize = parseInt(req.headers['content-length'], 10);
    } else if (req.body) {
        try {
            payloadSize = Buffer.byteLength(JSON.stringify(req.body));
        } catch (e) {
            payloadSize = 0;
        }
    }

    res.on('finish', () => {
        const elapHrTime = process.hrtime(startHrTime);
        const durationMs = Math.round((elapHrTime[0] * 1000) + (elapHrTime[1] / 1000000));
        
        const method = req.method;
        const path = req.originalUrl.split('?')[0]; // Strip query parameters for cleaner logs
        const statusCode = res.statusCode;

        // Asynchronously insert log in the database
        db.query(
            'INSERT INTO traffic_logs (method, path, status_code, payload_size, response_time) VALUES ($1, $2, $3, $4, $5)',
            [method, path, statusCode, payloadSize, durationMs]
        ).catch(err => {
            console.error('Failed to save traffic log telemetry:', err.message);
        });
    });

    next();
};
