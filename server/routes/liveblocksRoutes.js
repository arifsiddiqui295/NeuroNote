const express = require('express');
const { authLiveblocks } = require('../controllers/liveblocksController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/auth', protect, authLiveblocks);

module.exports = router;