const express = require('express');
const cors = require('cors');
const path = require('path');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const devopsRoutes = require('./routes/devopsRoutes');
const proxyRoutes = require('./routes/proxyRoutes');

const app = express();

app.use(cors());
app.use(requestLogger);
app.use(rateLimiter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Gateway & Auth Service' });
});

app.use(express.json());
app.use(require('./middleware/telemetryLogger'));

// App routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/devops', devopsRoutes);

// Proxy routes (placed last)
app.use(proxyRoutes);

// Catch-all
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found or method not allowed' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
