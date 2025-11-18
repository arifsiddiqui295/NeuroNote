import apiClient from './apiClient';
// 1. Get the base URL from the .env file
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/lessons`;
const createLesson = async (lessonData) => {
  const response = await apiClient.post(API_URL, lessonData);
  return response.data;
};

// Function to fetch all lessons for the logged-in user
const getLessons = async (workspaceId) => {
  const response = await apiClient.get(`${API_URL}/workspace/${workspaceId}`);
  return response.data;
};


const deleteLesson = async (lessonId) => {
  // This calls the backend DELETE /api/lessons/:lessonId route
  const response = await apiClient.delete(`${API_URL}/${lessonId}`);
  return response.data;
};
const lessonService = {
  getLessons,
  createLesson,
  deleteLesson
};

export default lessonService;