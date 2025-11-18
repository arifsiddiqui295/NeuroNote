import apiClient from './apiClient';

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/workspaces`;

// Get all workspaces for the logged-in user
const getWorkspaces = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

const createWorkspace = async (workspaceData) => {
    const response = await apiClient.post(API_URL, workspaceData);
    return response.data;
};

// NEW: Get details (including member list) for settings
const getWorkspaceDetails = async (workspaceId) => {
    // We can reuse the getWorkspaces and filter, or assume the workspace object has members.
    // NOTE: Our current getWorkspaces returns the array. We might need to filter it on the frontend 
    // or make a specific endpoint. For now, let's filter on frontend to save backend work.
    return null;
};

const inviteMember = async (workspaceId, email, role) => {
    const response = await apiClient.post(`${API_URL}/${workspaceId}/invite`, { email, role });
    return response.data;
};

const removeMember = async (workspaceId, userId) => {
    const response = await apiClient.delete(`${API_URL}/${workspaceId}/members/${userId}`);
    return response.data;
};

const updateMemberRole = async (workspaceId, userId, role) => {
    const response = await apiClient.put(`${API_URL}/${workspaceId}/members/${userId}`, { role });
    return response.data;
};

const leaveWorkspace = async (workspaceId) => {
    const response = await apiClient.delete(`${API_URL}/${workspaceId}/leave`);
    return response.data;
};

const deleteWorkspace = async (workspaceId) => {
    const response = await apiClient.delete(`${API_URL}/${workspaceId}`);
    return response.data;
};

const workspaceService = {
    getWorkspaces,
    createWorkspace,
    inviteMember,
    removeMember,
    updateMemberRole,
    leaveWorkspace,
    deleteWorkspace
};
export default workspaceService;