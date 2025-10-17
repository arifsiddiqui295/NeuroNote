const express = require('express');
const { updateProgress, getReviewQuestions } = require('../controllers/progressController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, updateProgress);
router.get('/review', protect, getReviewQuestions);

module.exports = router;