const express = require("express");
const { createLesson, getLessons } = require("../controllers/lessonController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createLesson);
router.get("/", protect, getLessons);

module.exports = router;
