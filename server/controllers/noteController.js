const Note = require("../models/Note"); // small typo: make sure filename matches ("Note.js" not "Notes.js")

// @desc    Create Note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { lessonId, content, type } = req.body;

    // Basic validation
    if (!lessonId || !content) {
      return res.status(400).json({ message: "Lesson ID and content are required" });
    }

    // Create note
    const note = await Note.create({
      lesson: lessonId,
      content, // can be JSON or text
      type: type || "from_notes", // default if not provided
      createdBy: req.user._id,
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: error.message });
  }
};
const updateNote = async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Ensure the note belongs to the user trying to update it
    if (note.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    note.content = content;
    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get Notes by Lesson
// @route   GET /api/notes/:lessonId
// @access  Private
const getNotesByLesson = async (req, res) => {
  try {
    const notes = await Note.find({
      lesson: req.params.lessonId,
      createdBy: req.user._id,
    }).sort({ createdAt: -1 }); // newest first

    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNote,
  getNotesByLesson,
  updateNote
};
