const Lesson = require('../models/Lesson');
const Note = require('../models/Note');
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');

// @desc    Create a new lesson within a workspace
// @route   POST /api/lessons
// @access  Private (Requires membership)
const createLesson = async (req, res) => {
  try {
    const { title, number, description, workspaceId } = req.body;
    console.log("Creating lesson with data:", req.body);
    // Check if user has permission to add to this workspace (must be admin or editor)
    if (req.memberRole === 'viewer') {
      return res.status(403).json({ message: 'You do not have permission to create lessons in this workspace.' });
    }

    const lesson = await Lesson.create({
      workspace: workspaceId,
      title,
      number,
      description,
    });

    // --- NEW: Automatically create an empty note for this lesson ---
    const defaultContent = [
      { type: 'p', children: [{ type: 'text', value: 'Start your notes here...' }] }
    ];

    await Note.create({
      workspace: workspaceId,
      lesson: lesson._id,
      content: defaultContent
    });
    res.status(201).json(lesson);
  } catch (error) {
    // Handle the duplicate key error
    // console.error("Error creating lesson:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A lesson with this number already exists in this workspace.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all lessons for a specific workspace
// @route   GET /api/lessons/workspace/:workspaceId
// @access  Private (Requires membership)
const getLessons = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const lessons = await Lesson.find({ workspace: workspaceId }).sort("number");
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // 1. Find the lesson to get its workspaceId
    const lesson = await Lesson.findById(lessonId).populate('workspace');
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // 2. Check user's permission for that workspace
    const member = lesson.workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' });
    }
    if (member.role === 'viewer') {
      return res.status(403).json({ message: 'You do not have permission to delete lessons.' });
    }

    // 3. Find all questions associated with this lesson
    const questions = await Question.find({ lesson: lessonId });
    const questionIds = questions.map(q => q._id);

    // 4. Perform Cascade Delete
    await Promise.all([
      Note.deleteOne({ lesson: lessonId }), // Delete the note
      Question.deleteMany({ lesson: lessonId }), // Delete all questions
      UserProgress.deleteMany({ question: { $in: questionIds } }), // Delete all progress for those questions
      Lesson.findByIdAndDelete(lessonId) // Finally, delete the lesson itself
    ]);

    res.status(200).json({ message: 'Lesson and all associated data deleted successfully.' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting lesson.' });
  }
};
module.exports = {
  createLesson,
  getLessons,
  deleteLesson
};