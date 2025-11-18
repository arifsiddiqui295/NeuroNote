import apiClient from './apiClient';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/questions`;


// Function to call the AI generation endpoint
const generateQuestions = async (workspaceId, { noteIds, source, count }) => {
    const body = { noteIds, source, count };
    const response = await apiClient.post(`${API_URL}/${workspaceId}/generate`, body);
    return response.data;
};

// This function needs the workspaceId
const getQuizQuestions = async (workspaceId, { lessonIds, source, limit }) => {
    const config = {
        params: { lessonIds: lessonIds.join(','), source, limit },
    };
    const response = await apiClient.get(`${API_URL}/${workspaceId}`, config);
    return response.data;
};

// This function needs the workspaceId
const getQuestionStats = async (workspaceId) => {
    const response = await apiClient.get(`${API_URL}/${workspaceId}/stats`);
    return response.data;
};

const autofixQuestion = async (questionId, comment) => {
    const body = { comment };
    const response = await apiClient.post(`${API_URL}/autofix/${questionId}`, body);
    return response.data;
};

// This function needs the workspaceId
const getSmartQuizQuestions = async (workspaceId, { lessonIds, limit }) => {
    const config = {
        params: { lessonIds: lessonIds.join(','), limit },
    };
    const response = await apiClient.get(`${API_URL}/${workspaceId}/smart-quiz`, config);
    return response.data;
};

const deleteQuestion = async (questionId) => {
    const response = await apiClient.delete(`${API_URL}/${questionId}`);
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