const Note = require('../models/Note');
const Lesson = require('../models/Lesson');
const Workspace = require('../models/Workspace');

// @desc    Get the single note for a specific lesson
// @route   GET /api/notes/lesson/:lessonId
// @access  Private (Requires membership)
const getNotesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // 1. Find the lesson to get its workspaceId
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // 2. Check user's permission for that workspace
        const workspace = await Workspace.findById(lesson.workspace);
        const member = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }

        // 3. Find and return the note associated with the lesson
        const note = await Note.findOne({ lesson: lessonId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found for this lesson' });
        }

        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a note
// @route   PUT /api/notes/:noteId
// @access  Private (Requires 'admin' or 'editor' role)
const updateNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { content } = req.body;

        // 1. Find the note to get its workspaceId
        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // 2. Check user's permission for that workspace
        const workspace = await Workspace.findById(note.workspace);
        const member = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }

        // 3. Check if the user has editing rights
        if (member.role === 'viewer') {
            return res.status(403).json({ message: 'You do not have permission to edit notes in this workspace.' });
        }

        // 4. Update the note
        note.content = content;
        await note.save();
        res.json(note);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    getNotesByLesson, 
    updateNote 
};