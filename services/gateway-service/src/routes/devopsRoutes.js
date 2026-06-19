const express = require('express');
const router = express.Router();
const devopsController = require('../controllers/devopsController');

router.get('/health', devopsController.getHealth);
router.get('/traffic', devopsController.getTrafficLogs);
router.get('/metrics', devopsController.getClickMetrics);
router.post('/metrics', devopsController.logClickMetric);

module.exports = router;
