const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    workspace: { // Replaces createdBy
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
}, { timestamps: true });

// We should index workspace and number together
LessonSchema.index({ workspace: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', LessonSchema);