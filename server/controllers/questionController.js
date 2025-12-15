const Note = require('../models/Note');
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const Workspace = require('../models/Workspace');
const Lesson = require('../models/Lesson');
const jsonToMarkdown = require('../utils/jsonToMarkdown');
const { proModel, flashModel, proCorrectionModel, flashCorrectionModel } = require('../config/gemini');
const mongoose = require('mongoose');

// Helper function to check permissions manually
const checkMembershipById = async (workspaceId, userId) => {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return null;
    const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString()
    );
    return member; // Returns the member object (with role) or undefined
};


// @desc    Create a question manually
// @route   POST /api/questions/:workspaceId
const createQuestion = async (req, res) => {
    try {
        if (req.memberRole === 'viewer') {
            return res.status(403).json({ message: 'Viewers cannot create questions.' });
        }

        const { lessonId, type, questionText, options, answer, source } = req.body;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson || lesson.workspace.toString() !== req.params.workspaceId) {
            return res.status(400).json({ message: 'Lesson not found in this workspace.' });
        }

        const question = await Question.create({
            ...req.body,
            lesson: lessonId,
            workspace: req.params.workspaceId,
        });

        res.status(201).json(question);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This question text already exists in this workspace.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get random quiz questions
// @route   GET /api/questions/:workspaceId
const getQuizQuestions = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { lessonIds, source, limit = 10 } = req.query;

        const filter = { workspace: new mongoose.Types.ObjectId(workspaceId) };

        if (lessonIds) {
            const lessonObjectIds = lessonIds.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
            filter.lesson = { $in: lessonObjectIds };
        }
        if (source) {
            filter.source = source;
        }

        const questions = await Question.aggregate([
            { $match: filter },
            { $sample: { size: parseInt(limit) } }
        ]);

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate AI questions
// @route   POST /api/questions/:workspaceId/generate
const generateQuestions = async (req, res) => {
    try {
        if (req.memberRole === 'viewer') {
            return res.status(403).json({ message: 'Viewers cannot generate questions.' });
        }
        const { workspaceId } = req.params;
        const { noteIds, source = 'from_notes', count = 5 } = req.body;
        // console.log("AI question generation requested with:", req.body);
        if (!noteIds || noteIds.length === 0) {
            return res.status(400).json({ message: 'Note IDs are required' });
        }
        const notes = await Note.find({
            '_id': { $in: noteIds },
            'workspace': workspaceId
        }).populate({ path: 'lesson', populate: { path: 'workspace', select: 'context' } });

        if (notes.length === 0) {
            return res.status(404).json({ message: 'No valid notes found in this workspace.' });
        }
        // Check for orphaned notes (lesson has been deleted)
        if (!notes[0].lesson || !notes[0].lesson.workspace) {
            console.error(`Data integrity error: Note ${notes[0]._id} is orphaned or its lesson is missing a workspace.`);
            return res.status(404).json({ message: 'Data integrity error: Could not find a valid lesson for the selected note.' });
        }

        const combinedMarkdown = notes.map(note => jsonToMarkdown(note.content)).join('\n\n---\n\n');

        // 3. SECURITY CHECK: Fail if empty
        if (!combinedMarkdown || combinedMarkdown.trim().length < 10) {
            return res.status(400).json({
                message: "The selected notes appear to be empty. Please write some text in your lesson before generating a quiz."
            });
        }
        const aiContext = notes[0].lesson.workspace.context || "General Knowledge";

        let prompt;
        if (source === 'from_notes') {
            prompt = `You are a helpful expert and tutor for ${aiContext}. Based ONLY on the following notes about ${aiContext}, generate ${count} quiz questions.
            Rules:
            1. The questions must be directly answerable from the provided notes.
            2. You MUST respond with a valid JSON array of objects. Do not include any text outside of the JSON array.
            3. Each object must have the structure: {"type": "...", "questionText": "...", "options": [...], "answer": "...", "explanation": "A brief, easy-to-understand, and beginner-friendly one-sentence explanation of why the answer is correct.."}
            4. IMPORTANT: The "type" field MUST be either "mcq" or "fill-in-the-blank".

            Here are the notes:
            \`\`\`markdown
            ${combinedMarkdown}
            \`\`\``;
        } else { // source === 'topic_related'
            prompt = `You are a helpful expert and tutor for ${aiContext}. The following notes cover ${aiContext}. Your task is to generate ${count} new, topic-related questions that test a broader understanding, but ARE NOT directly answered in the notes.
            Rules:
            1. DO NOT create questions that can be answered by simply copying text.
            2. You MUST respond with a valid JSON array of objects. Do not include any text outside of the JSON array.
            3. Each object must have the structure: {"type": "...", "questionText": "...", "options": [...], "answer": "...", "explanation": "A brief, easy-to-understand, and beginner-friendly one-sentence explanation of why the answer is correct.."}
            4. IMPORTANT: The "type" field MUST be either "mcq" or "fill-in-the-blank".

            Here are the notes for context:
            \`\`\`markdown
            ${combinedMarkdown}
            \`\`\``;
        }

        let aiTextResponse;
        try {
            const result = await proModel.generateContent(prompt);
            aiTextResponse = (await result.response).text();
        } catch (proError) {
            console.warn("Pro model failed. Falling back to Flash model.", proError.message);
            const result = await flashModel.generateContent(prompt);
            aiTextResponse = (await result.response).text();
        }

        let generatedQuestions;

        try {
            const cleanedResponse = aiTextResponse.replace(/```json\n|```/g, '').trim();
            generatedQuestions = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({ message: "Failed to parse AI response." });
        }

        console.log("Generated Questions from AI:", generatedQuestions);

        const questionsToSave = generatedQuestions.map(q => ({
            ...q,
            lesson: notes[0].lesson._id,
            workspace: workspaceId,
            source: source,
        }));

        const newQuestions = await Question.insertMany(questionsToSave, { ordered: false });
        console.log("Generated Questions Saved:", newQuestions);
        res.status(201).json(newQuestions);

    } catch (error) {
        console.error("FAILED TO SAVE QUESTIONS:", error);
        res.status(500).json({ message: "AI question generation failed.", error: error.message });
    }
};

// @desc    Get question stats for a workspace
// @route   GET /api/questions/:workspaceId/stats
const getQuestionStats = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const stats = await Question.aggregate([
            { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
            {
                $group: {
                    _id: { lesson: "$lesson", source: "$source" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.lesson",
                    counts: { $push: { source: "$_id.source", count: "$count" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    lessonId: "$_id",
                    stats: { $arrayToObject: { $map: { input: "$counts", as: "c", in: ["$$c.source", "$$c.count"] } } }
                }
            }
        ]);

        const statsMap = stats.reduce((acc, item) => {
            acc[item.lessonId] = item.stats;
            return acc;
        }, {});

        res.json(statsMap);
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats" });
    }
};

// @desc    Autofix a question
// @route   POST /api/questions/autofix/:questionId
const autofixQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { comment } = req.body;
        console.log(`Autofix requested for question ${questionId} with comment: ${comment}`);
        const originalQuestion = await Question.findById(questionId).populate({
            path: 'lesson',
            populate: { path: 'workspace' }
        });

        if (!originalQuestion) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        // --- FIX for orphaned data ---
        if (!originalQuestion.lesson || !originalQuestion.lesson.workspace) {
            console.error(`Data integrity error: Question ${originalQuestion._id} is orphaned.`);
            return res.status(404).json({ message: 'Data integrity error: Question is orphaned.' });
        }
        // --- END OF FIX ---

        const workspaceId = originalQuestion.lesson.workspace._id;
        const member = await checkMembershipById(workspaceId, req.user._id);

        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }
        if (member.role === 'viewer') {
            return res.status(403).json({ message: 'Viewers cannot fix questions.' });
        }

        const aiContext = originalQuestion.lesson.workspace.context || "General Knowledge";

        const prompt = `You are a quality control expert for a quiz app on ${aiContext}. A user reported an error.
        User Feedback: "${comment}"
        Original Question: ${JSON.stringify({
            questionText: originalQuestion.questionText,
            options: originalQuestion.options,
            answer: originalQuestion.answer,
            explanation: originalQuestion.explanation,
        })}
        Respond with a JSON object of the corrected question: {"evaluation": {"isUserCorrect": boolean, "reasoning": "..."}, "correctedQuestion": {...}}`;

        let aiTextResponse;
        try {
            const result = await proCorrectionModel.generateContent(prompt);
            aiTextResponse = (await result.response).text();
        } catch (proError) {
            const result = await flashCorrectionModel.generateContent(prompt);
            aiTextResponse = (await result.response).text();
        }

        let aiResponse;
        try {
            const cleanedResponse = aiTextResponse.replace(/```json\n|```/g, '').trim();
            aiResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({ message: "Failed to parse AI's correction.", error: error.message });
        }

        if (aiResponse.evaluation?.isUserCorrect && aiResponse.correctedQuestion) {
            await Question.findByIdAndUpdate(questionId, aiResponse.correctedQuestion);
        }

        if (aiResponse.evaluation) {
            res.status(200).json(aiResponse.evaluation);
        } else {
            throw new Error("AI response was missing 'evaluation' key.");
        }

    } catch (error) {
        console.error("Autofix failed:", error);
        res.status(500).json({ message: "AI question autofix failed." });
    }
};

// @desc    Get smart quiz questions
// @route   GET /api/questions/:workspaceId/smart-quiz
const getSmartQuizQuestions = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { lessonIds, limit = 10 } = req.query;
        const userId = req.user._id;

        const filter = { workspace: new mongoose.Types.ObjectId(workspaceId) };
        if (lessonIds) {
            filter.lesson = { $in: lessonIds.split(',').map(id => new mongoose.Types.ObjectId(id.trim())) };
        }

        let smartQuiz = [];
        const userProgressFilter = { user: userId, workspace: workspaceId };

        // Priority 1: Incorrect
        const wrongProgress = await UserProgress.find({ ...userProgressFilter, incorrectCount: { $gt: 0 } }).sort({ incorrectCount: -1 });
        const wrongQuestionIds = wrongProgress.map(p => p.question);
        const wrongQuestions = await Question.find({ ...filter, _id: { $in: wrongQuestionIds } });
        smartQuiz.push(...wrongQuestions);

        if (smartQuiz.length >= limit) return res.json(smartQuiz.slice(0, limit));

        // Priority 2: Unattempted
        const attemptedQuestionIds = (await UserProgress.find(userProgressFilter)).map(p => p.question);
        const unattemptedQuestions = await Question.find({ ...filter, _id: { $nin: attemptedQuestionIds } });
        smartQuiz.push(...unattemptedQuestions);

        if (smartQuiz.length >= limit) return res.json(smartQuiz.slice(0, limit));

        // Priority 3: Random
        const existingIds = smartQuiz.map(q => q._id);
        const randomQuestions = await Question.aggregate([
            { $match: { ...filter, _id: { $nin: existingIds } } },
            { $sample: { size: limit - smartQuiz.length } }
        ]);
        smartQuiz.push(...randomQuestions);

        res.json(smartQuiz.slice(0, limit));

    } catch (error) {
        res.status(500).json({ message: "Error fetching smart quiz." });
    }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:questionId
const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        const member = await checkMembershipById(question.workspace, req.user._id);

        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }
        if (member.role === 'viewer') {
            return res.status(403).json({ message: 'Viewers cannot delete questions.' });
        }

        await Question.findByIdAndDelete(questionId);
        await UserProgress.deleteMany({ question: questionId, workspace: question.workspace });

        res.status(200).json({ message: 'Question deleted successfully.' });

    } catch (error) {
        res.status(500).json({ message: "Failed to delete question." });
    }
};

module.exports = {
    createQuestion,
    getQuizQuestions,
    generateQuestions,
    getQuestionStats,
    autofixQuestion,
    getSmartQuizQuestions,
    deleteQuestion
};