const UserProgress = require('../models/UserProgress');
const Workspace = require('../models/Workspace');

// @desc    Update a user's progress for a specific question
// @route   POST /api/progress
// @access  Private
const updateProgress = async (req, res) => {
    const { questionId, wasCorrect, workspaceId } = req.body;
    const userId = req.user._id;

    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID is required.' });
    }

    try {
        // Check if user is part of this workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }
        const member = workspace.members.find(
            (m) => m.user.toString() === userId.toString()
        );
        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }

        // Find existing progress or create a new one
        let progress = await UserProgress.findOne({ 
            user: userId, 
            question: questionId, 
            workspace: workspaceId 
        });

        if (!progress) {
            progress = new UserProgress({ 
                user: userId, 
                question: questionId, 
                workspace: workspaceId 
            });
        }

        const now = new Date();

        if (wasCorrect) {
            // If correct, reset the incorrect streak and schedule normally
            progress.correctCount += 1;
            progress.consecutiveIncorrect = 0; // Reset the streak
            progress.interval = Math.ceil(progress.interval * progress.easeFactor);
            progress.easeFactor += 0.1;
            progress.nextReviewDate = new Date(new Date().setDate(now.getDate() + progress.interval));
        } else {
            // If incorrect, use the Leech Tamer algorithm
            progress.incorrectCount += 1;
            progress.consecutiveIncorrect += 1; // Increment the streak
            progress.interval = 1; // Reset interval for the next cycle
            progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.2);

            if (progress.consecutiveIncorrect === 1) {
                // First mistake: review in 3 hours
                progress.nextReviewDate = new Date(new Date().setHours(now.getHours() + 3));
            } else {
                // Second or subsequent mistake: review in 24 hours
                progress.nextReviewDate = new Date(new Date().setDate(now.getDate() + 1));
            }
        }
        
        await progress.save();
        res.status(200).json(progress);

    } catch (error) {
        res.status(500).json({ message: 'Error updating progress.' });
    }
};

// @desc    Get all questions that are due for review for a workspace
// @route   GET /api/progress/review/:workspaceId
// @access  Private
const getReviewQuestions = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;
        const { limit = 10 } = req.query;

        // Check user membership (we can skip checkWorkspaceMembership middleware here 
        // as we are manually checking)
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }
        const member = workspace.members.find(
            (m) => m.user.toString() === userId.toString()
        );
        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }

        // Find progress items for this user AND this workspace
        const progressItems = await UserProgress.find({
            user: userId,
            workspace: workspaceId,
            nextReviewDate: { $lte: new Date() }
        })
        .sort({ nextReviewDate: 1 }) // Review oldest due items first
        .limit(parseInt(limit))
        .populate('question');

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