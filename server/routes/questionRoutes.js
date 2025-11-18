const express = require('express');
const {
    createQuestion,
    getQuizQuestions,
    generateQuestions,
    getQuestionStats,
    autofixQuestion,
    getSmartQuizQuestions,
    deleteQuestion
} = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');
const { checkWorkspaceMembership } = require('../middlewares/permissionMiddleware');

const router = express.Router();

// Routes that pass workspaceId in the URL
// We can use our middleware here
router.get('/:workspaceId', protect, checkWorkspaceMembership, getQuizQuestions);
router.post('/:workspaceId', protect, checkWorkspaceMembership, createQuestion);
router.get('/:workspaceId/stats', protect, checkWorkspaceMembership, getQuestionStats);
router.get('/:workspaceId/smart-quiz', protect, checkWorkspaceMembership, getSmartQuizQuestions);
router.post('/:workspaceId/generate', protect, checkWorkspaceMembership, generateQuestions);//finish

// Routes that pass a specific item ID
// We must check permissions *inside* the controller
router.post('/autofix/:questionId', protect, autofixQuestion);
router.delete('/:questionId', protect, deleteQuestion);

module.exports = router;