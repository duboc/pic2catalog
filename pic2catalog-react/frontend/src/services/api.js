import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// API functions
export const generateCatalog = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await api.post('/generate_catalog', formData);
    return response.data;
  } catch (error) {
    console.error('Error generating catalog:', error);
    throw error;
  }
};

export default api; 