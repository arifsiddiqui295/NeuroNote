import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/questions`;

// Function to get the auth token from localStorage
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Function to call the AI generation endpoint
const generateQuestions = async ({ noteIds, source, count }) => {
    const config = {
        headers: getAuthHeader(),
    };
    const body = {
        noteIds,
        source,
        count,
    };
    const response = await axios.post(`${API_URL}/generate`, body, config);
    return response.data;
};
const getQuizQuestions = async ({ lessonIds, source, limit }) => {
    const config = {
        headers: getAuthHeader(),
        params: {
            lessonIds: lessonIds.join(','), // Convert array to comma-separated string
            source,
            limit,
        },
    };
    // console.log("config = ", config)
    const response = await axios.get(API_URL, config);
    return response.data;
};

const getQuestionStats = async () => {
    const config = { headers: getAuthHeader() };
    const response = await axios.get(`${API_URL}/stats`, config);
    return response.data;
};

const autofixQuestion = async (questionId, comment) => {
    const config = { headers: getAuthHeader() };
    const body = { comment };
    const response = await axios.post(`${API_URL}/${questionId}/autofix`, body, config);
    return response.data;
};

const getSmartQuizQuestions = async ({ lessonIds, limit }) => {
    const config = {
        headers: getAuthHeader(),
        params: {
            lessonIds: lessonIds.join(','),
            limit,
        },
    };
    const response = await axios.get(`${API_URL}/smart-quiz`, config);
    return response.data;
};

const deleteQuestion = async (questionId) => {
    const config = { headers: getAuthHeader() };
    const response = await axios.delete(`${API_URL}/${questionId}`, config);
    return response.data;
};
const questionService = {
    generateQuestions,
    getQuizQuestions,
    getQuestionStats,
    autofixQuestion,
    getSmartQuizQuestions,
    deleteQuestion,
};

export default questionService;