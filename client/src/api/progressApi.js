import apiClient from './apiClient';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/progress`;

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Function to update the SRS progress for a question
const updateProgress = async (questionId, wasCorrect) => {
    const config = {
        headers: getAuthHeader(),
    };
    const body = {
        questionId,
        wasCorrect,
    };
    const response = await apiClient.post(API_URL, body, config);
    return response.data;
};
const getReviewQuestions = async (limit) => {
    const config = {
        headers: getAuthHeader(),
        params: { limit },
    };
    const response = await apiClient.get(`${API_URL}/review`, config);
    return response.data;
};
const progressService = {
    updateProgress,
    getReviewQuestions
};

export default progressService;