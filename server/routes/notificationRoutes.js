const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { addClient } = require('../utils/notificationManager');

const router = express.Router();

router.get('/stream', protect, (req, res) => {
    // Essential headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add this user's connection to our list
    addClient(req.user._id, res);
});

module.exports = router;