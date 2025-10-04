const Note = require('../models/Note');
const Question = require('../models/Question');
const jsonToMarkdown = require('../utils/jsonToMarkdown')
const { proModel, flashModel } = require('../config/gemini');
const mongoose = require('mongoose');
// @desc    Create a question manually (for testing)
// @route   POST /api/questions
// @access  Private
const createQuestion = async (req, res) => {
    try {
        const { lessonId, type, questionText, options, answer, source } = req.body;

        if (!lessonId || !type || !questionText || !answer || !source) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const question = await Question.create({
            lesson: lessonId,
            type,
            questionText,
            options,
            answer,
            source,
            createdBy: req.user._id,
        });

        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get questions for a quiz
// @route   GET /api/questions
// @access  Private
// controllers/questionController.js

const getQuizQuestions = async (req, res) => {
    try {
        const { lessonIds, source, limit = 10 } = req.query;

        const filter = { createdBy: req.user._id };

        if (lessonIds) {
            const lessonIdArray = lessonIds.split(',');

            // NEW FIX: Convert each string ID into a MongoDB ObjectId
            const lessonObjectIds = lessonIdArray.map(id => new mongoose.Types.ObjectId(id.trim()));

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
        console.error("Error fetching quiz questions:", error);
        res.status(500).json({ message: error.message });
    }
};
const generateQuestions = async (req, res) => {
    try {
        // Step 1: Get data from request
        const { noteIds, source = 'from_notes', count = 5 } = req.body;

        if (!noteIds || noteIds.length === 0) {
            return res.status(400).json({ message: 'Note IDs are required' });
        }

        // Step 2: Fetch notes and convert their content to Markdown
        const notes = await Note.find({
            '_id': { $in: noteIds },
            'createdBy': req.user._id
        });

        if (notes.length === 0) {
            return res.status(404).json({ message: 'No valid notes found or not authorized' });
        }

        const combinedMarkdown = notes
            .map(note => jsonToMarkdown(note.content))
            .join('\n\n---\n\n'); // Separate notes with a divider

        if (!combinedMarkdown) {
            return res.status(400).json({ message: 'Note content is empty' });
        }

        // Step 3: Build the dynamic prompt based on the 'source'
        let prompt;
        if (source === 'from_notes') {
            prompt = `You are a helpful German language teacher creating a quiz. Based ONLY on the following notes, generate ${count} diverse quiz questions.

Rules:
1. The questions must be directly answerable from the provided notes.
2. You MUST respond with a valid JSON array of objects. Do not include any text outside of the JSON array.

Each object must have the structure: {"type": "mcq" or "fill-in-the-blank", "questionText": "...", "options": [...], "answer": "...","explanation": "A brief, easy-to-understand, and beginner-friendly one-sentence explanation of why the answer is correct."}

Here are the notes:
\`\`\`markdown
${combinedMarkdown}
\`\`\``;
        } else { // source === 'topic_related'
            prompt = `You are a helpful German language teacher creating a quiz. The following notes cover certain topics. Your task is to generate ${count} new, topic-related questions that test a broader understanding of these topics, but ARE NOT directly answered in the notes.

Rules:
1. DO NOT create questions that can be answered by simply copying text from the notes.
2. You MUST respond with a valid JSON array of objects. Do not include any text outside of the JSON array.

Each object must have the structure: {"type": "mcq" or "fill-in-the-blank", "questionText": "...", "options": [...], "answer": "...","explanation": "A brief, easy-to-understand, and beginner-friendly one-sentence explanation of why the answer is correct.."}

Here are the notes for context on the topics:
\`\`\`markdown
${combinedMarkdown}
\`\`\``;
        }

        // Step 4: Call the AI, with a fallback from Pro to Flash model
        let aiTextResponse;
        try {
            const result = await proModel.generateContent(prompt);
            const response = await result.response;
            aiTextResponse = response.text();
        } catch (proError) {
            console.warn("Pro model failed. Falling back to Flash model.", proError.message);
            const result = await flashModel.generateContent(prompt);
            const response = await result.response;
            aiTextResponse = response.text();
        }

        // Step 5: Clean and parse the AI's JSON response
        let generatedQuestions;
        try {
            const cleanedResponse = aiTextResponse.replace(/```json\n|```/g, '').trim();
            generatedQuestions = JSON.parse(cleanedResponse);
        } catch (error) {
            console.error("AI returned invalid JSON:", aiTextResponse);
            return res.status(500).json({ message: "Failed to parse AI response. Please try again." });
        }

        // Step 6: Prepare questions for saving to the database
        const questionsToSave = generatedQuestions.map(q => ({
            ...q,
            lesson: notes[0].lesson,
            source: source,
            createdBy: req.user._id,
        }));

        // Step 7: Save the new questions to the database
        const newQuestions = await Question.insertMany(questionsToSave, { ordered: false });

        res.status(201).json(newQuestions);

    } catch (error) {
        console.error("Fatal error during question generation:", error);
        res.status(500).json({ message: "AI question generation failed after multiple attempts." });
    }
};
const getQuestionStats = async (req, res) => {
    try {
        const stats = await Question.aggregate([
            // Match questions created by the logged-in user
            { $match: { createdBy: req.user._id } },
            // Group by lesson and source to get counts
            {
                $group: {
                    _id: { lesson: "$lesson", source: "$source" },
                    count: { $sum: 1 }
                }
            },
            // Group again by just the lesson to format the data
            {
                $group: {
                    _id: "$_id.lesson",
                    counts: { $push: { source: "$_id.source", count: "$count" } }
                }
            },
            // Format the final output
            {
                $project: {
                    _id: 0,
                    lessonId: "$_id",
                    stats: { $arrayToObject: { $map: { input: "$counts", as: "c", in: ["$$c.source", "$$c.count"] } } }
                }
            }
        ]);

        // Convert array to an object keyed by lessonId for easy frontend lookup
        const statsMap = stats.reduce((acc, item) => {
            acc[item.lessonId] = item.stats;
            return acc;
        }, {});

        res.json(statsMap);
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats" });
    }
};
const autofixQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: 'A comment explaining the error is required.' });
        }

        const originalQuestion = await Question.findById(questionId);
        if (!originalQuestion) {
            return res.status(404).json({ message: 'Original question not found.' });
        }

        const prompt = `You are a quality control expert for a German language quiz app. A user has reported an error in the following quiz question.

Your tasks are:
1.  **Evaluate:** Determine if the user's feedback is correct.
2.  **Correct (if needed):** If the user is correct, provide a fixed version of the question.

User Feedback: "${comment}"

Original Question JSON:
${JSON.stringify({
            questionText: originalQuestion.questionText,
            options: originalQuestion.options,
            answer: originalQuestion.answer,
            explanation: originalQuestion.explanation,
        })}

You MUST respond with a single, valid JSON object with the following structure:
{
  "evaluation": {
    "isUserCorrect": boolean,
    "reasoning": "A brief explanation of your decision. If the user is wrong, explain the German grammar rule they misunderstood."
  },
  "correctedQuestion": {
    "questionText": "...",
    "options": ["..."],
    "answer": "...",
    "explanation": "..."
  }
}

If the original question was already correct, the "correctedQuestion" object should be identical to the original. Respond with only the JSON object.`;

        let aiTextResponse;
        try {
            const result = await proCorrectionModel.generateContent(prompt);
            aiTextResponse = (await result.response).text();
        } catch (proError) {
            console.warn("Pro model failed for autofix. Falling back to Flash model.", proError.message);
            const result = await flashCorrectionModel.generateContent(prompt);
            aiTextResponse = (await result.response).text();
        }

        let aiResponse;
        try {
            const cleanedResponse = aiTextResponse.replace(/```json\n|```/g, '').trim();
            aiResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({ message: "Failed to parse AI's correction." });
        }

        // If the AI determined the user was correct, update the question in the DB
        if (aiResponse.evaluation?.isUserCorrect && aiResponse.correctedQuestion) {
            await Question.findByIdAndUpdate(questionId, aiResponse.correctedQuestion);
        }
        if (aiResponse.evaluation) {
            res.status(200).json(aiResponse.evaluation);
        } else {
            throw new Error("AI response was missing the 'evaluation' key.");
        }

    } catch (error) {
        console.error("Fatal error during question autofix:", error);
        res.status(500).json({ message: "AI question autofix failed." });
    }
};


module.exports = {
    createQuestion,
    getQuizQuestions,
    generateQuestions,
    getQuestionStats,
    autofixQuestion,
};