import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL;

// 2. Create the specific URL for your auth service
const API_URL = `${BASE_URL}/upload`;

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const config = {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
        },
    };

    const response = await axios.post(API_URL, formData, config);
    return response.data;
};

const deleteImage = async (imageUrl) => {
    const config = {
        headers: getAuthHeader(),
    };
    const response = await axios.delete(API_URL, { ...config, data: { imageUrl } });
    return response.data;
};

const uploadService = {
    uploadImage,
    deleteImage,
};

export default uploadService;