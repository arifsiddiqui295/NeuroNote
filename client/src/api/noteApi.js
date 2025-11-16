import apiClient from './apiClient';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/notes`;
// Function to get the auth token from localStorage
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Fetch all notes for a specific lesson
const getNotesByLesson = async (lessonId) => {
    const config = { headers: getAuthHeader() };
    const response = await apiClient.get(`${API_URL}/${lessonId}`, config);
    // We'll assume one note per lesson for now
    return response.data[0];
};

// Create or update a note
const createNote  = async (noteData) => {
    const config = { headers: getAuthHeader() };
    // We'll use a POST request. The backend can handle creating or updating.
    // For a real app, you might have separate POST (create) and PUT (update) routes.
    const response = await apiClient.post(API_URL, noteData, config);
    return response.data;
};

const updateNote = async (noteId, noteData) => {
    const config = { headers: getAuthHeader() };
    const response = await apiClient.put(`${API_URL}/${noteId}`, noteData, config);
    return response.data;
};


const noteService = {
    getNotesByLesson,
    createNote ,
    updateNote,
};

export default noteService;