import apiClient from './apiClient';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/progress`;


// Function to update the SRS progress for a question
const updateProgress = async (questionId, wasCorrect, workspaceId) => {
    // No config needed, apiClient handles authH
    const body = {
        questionId,
        wasCorrect,
        workspaceId, // Pass the workspaceId
    };
    const response = await apiClient.post(API_URL, body);
    return response.data;
};

// Function to fetch review questions for a specific workspace
const getReviewQuestions = async (workspaceId, limit) => {
    const config = {
        params: { limit },
    };
    // Use the new, correct route
    const response = await apiClient.get(`${API_URL}/review/${workspaceId}`, config);
    return response.data;
};

const progressService = {
    updateProgress,
    getReviewQuestions,
};
export default progressService;