const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    workspace: { // Replaces createdBy
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);