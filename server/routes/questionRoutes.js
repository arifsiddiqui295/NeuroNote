const express = require('express');
const {
    createQuestion,
    getQuizQuestions,
    generateQuestions,
    getQuestionStats,
    autofixQuestion,
    getSmartQuizQuestions,
    deleteQuestion } = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, createQuestion);
router.get('/', protect, getQuizQuestions);
router.post('/generate', protect, generateQuestions);
router.get('/stats', protect, getQuestionStats);
router.post('/:questionId/autofix', protect, autofixQuestion);
router.get('/smart-quiz', protect, getSmartQuizQuestions);
router.delete('/:questionId', protect, deleteQuestion);

module.exports = router;