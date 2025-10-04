const express = require("express");
const { createNote, getNotesByLesson, updateNote } = require("../controllers/noteController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createNote);
router.get("/:lessonId", protect, getNotesByLesson);
router.put("/:noteId", protect, updateNote);
module.exports = router;
