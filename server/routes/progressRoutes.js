const express = require('express');
const { updateProgress, getReviewQuestions } = require('../controllers/progressController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to update progress (workspaceId will be in the req.body)
router.post('/', protect, updateProgress);

// Route to get review questions for a specific workspace
router.get('/review/:workspaceId', protect, getReviewQuestions);

module.exports = router;