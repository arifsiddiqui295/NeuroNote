const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'editor',
    }
}, { _id: false });

const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    // The "context" for the AI, e.g., "German Language", "Data Structures"
    context: {
        type: String,
        default: "General Knowledge",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [memberSchema],
}, { timestamps: true });

module.exports = mongoose.model('Workspace', WorkspaceSchema);