const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI_generate = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const proModel = genAI_generate.getGenerativeModel({ model: "gemini-2.5-pro" });
const flashModel = genAI_generate.getGenerativeModel({ model: "gemini-2.5-flash" });



const genAI_correct = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FOR_CORRECTION);

const proCorrectionModel = genAI_correct.getGenerativeModel({ model: "gemini-2.5-pro" });
const flashCorrectionModel = genAI_correct.getGenerativeModel({ model: "gemini-2.5-flash" });



module.exports = {
    proModel,
    flashModel,
    proCorrectionModel,
    flashCorrectionModel
};