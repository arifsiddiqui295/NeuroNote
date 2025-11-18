const express = require("express");
const { getNotesByLesson, updateNote } = require("../controllers/noteController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get the note for a specific lesson
router.get("/lesson/:lessonId", protect, getNotesByLesson);

// Update a specific note
router.put("/:noteId", protect, updateNote);

module.exports = router;