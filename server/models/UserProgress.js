const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
    },
    // The time in days until the next review
    interval: {
        type: Number,
        default: 1,
    },
    // A factor that adjusts how quickly the interval grows
    easeFactor: {
        type: Number,
        default: 2.5,
    },
    // The next date this question should be reviewed
    nextReviewDate: {
        type: Date,
        default: Date.now,
    },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure a user can only have one progress entry per question
UserProgressSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);