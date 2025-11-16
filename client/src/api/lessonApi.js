import apiClient from './apiClient';
// 1. Get the base URL from the .env file
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/lessons`;
const createLesson = async (lessonData) => {
    const config = {
        headers: getAuthHeader(),
    };
    const response = await apiClient.post(API_URL, lessonData, config);
    return response.data;
};
// Function to get the auth token from localStorage
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Function to fetch all lessons for the logged-in user
const getLessons = async () => {
    const config = {
        headers: getAuthHeader(),
    };
    const response = await apiClient.get(API_URL, config);
    return response.data;
};

const lessonService = {
    getLessons,
    createLesson
};

export default lessonService;