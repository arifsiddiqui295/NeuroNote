const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  workspace:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'fill-in-the-blank', 'translation'],
    required: true,
  },
  questionText: {
    type: String,
    required: true,
    // unique: true, <-- REMOVE THIS LINE
  },
  options: {
    type: [String],
  },
  answer: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ['from_notes', 'topic_related'],
    required: true,
  },
  noteSnippet: {
    type: String,
  },
  explanation: {
    type: String,
  },
}, { timestamps: true });

// --- ADD THIS LINE ---
// This ensures questionText is unique only *within* the same workspace
QuestionSchema.index({ workspace: 1, questionText: 1 }, { unique: true });

module.exports = mongoose.model('Question', QuestionSchema);