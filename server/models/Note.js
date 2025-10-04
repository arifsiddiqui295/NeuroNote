const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // <-- allows JSON or any object
    required: true,
  },
  type: {
    type: String,
    enum: ["from_notes", "extra"],
    default: "from_notes",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Note", NoteSchema);
