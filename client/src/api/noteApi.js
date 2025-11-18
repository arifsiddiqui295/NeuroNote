import apiClient from './apiClient';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/notes`;
// Function to get the auth token from localStorage

const getNotesByLesson = async (lessonId) => {
    // This endpoint fetches the note associated with a lesson
    const response = await apiClient.get(`${API_URL}/lesson/${lessonId}`);
    return response.data; // This returns the full Note object
};

const createNote = async (noteData) => {
    const response = await apiClient.post(API_URL, noteData);
    return response.data;
};

const updateNote = async (noteId, noteData) => {
    const response = await apiClient.put(`${API_URL}/${noteId}`, noteData);
    return response.data;
};

const noteService = {
    getNotesByLesson,
    createNote,
    updateNote,
};

export default noteService;