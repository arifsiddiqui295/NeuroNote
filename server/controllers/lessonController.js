const Lesson = require("../models/Lesson");

// @desc Create Lesson
// @route POST /api/lessons
// @access Private
const createLesson = async (req, res) => {
  try {
    const { title, number, description } = req.body;

    const exists = await Lesson.findOne({ number });
    if (exists) return res.status(400).json({ message: "Lesson already exists" });

    const lesson = await Lesson.create({
      title,
      number,
      description,
      createdBy: req.user._id
    });

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all Lessons
// @route GET /api/lessons
// @access Private
const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ createdBy: req.user._id }).sort("number");
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLesson, getLessons };
