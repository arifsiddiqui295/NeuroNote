const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'fill-in-the-blank', 'translation'], // mcq = multiple choice
    required: true,
  },
  questionText: {
    type: String,
    required: true,
    unique: true,
  },
  options: {
    type: [String], // Array of strings for MCQ options
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
    type: String, // Optional: The exact text from notes this was based on
  },
  explanation: {
    type: String, 
  },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);