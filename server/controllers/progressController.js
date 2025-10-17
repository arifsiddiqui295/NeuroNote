const UserProgress = require('../models/UserProgress');

// @desc    Update a user's progress for a specific question
// @route   POST /api/progress
// @access  Private
const updateProgress = async (req, res) => {
    const { questionId, wasCorrect } = req.body;
    const userId = req.user._id;

    try {
        let progress = await UserProgress.findOne({ user: userId, question: questionId });
        if (!progress) {
            progress = new UserProgress({ user: userId, question: questionId });
        }
        const now = new Date();
        // --- UPDATE COUNTERS ---
        if (wasCorrect) {
            progress.correctCount += 1;
            progress.interval = Math.ceil(progress.interval * progress.easeFactor);
            progress.easeFactor += 0.1;
            progress.nextReviewDate = new Date(now.setDate(now.getDate() + progress.interval));
        } else {
            progress.incorrectCount += 1;
            progress.interval = 1;
            progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.2);
            progress.nextReviewDate = new Date(now.setHours(now.getHours() + 3));
        }

        await progress.save();
        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Error updating progress.' });
    }
};
const getReviewQuestions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 10 } = req.query;

        // Find progress items where the next review date is in the past
        const progressItems = await UserProgress.find({
            user: userId,
            nextReviewDate: { $lte: new Date() }
        })
            .limit(parseInt(limit))
            .populate('question'); // This joins the question data

        // Extract just the question part from the progress items
        const questions = progressItems.map(item => item.question).filter(q => q);

        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review questions.' });
    }
};
module.exports = {
    updateProgress,
    getReviewQuestions,
};