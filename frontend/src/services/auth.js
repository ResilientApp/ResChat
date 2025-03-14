import axios from '../utils/axios';

export const login = async (username, password) => {
  try {
    const response = await axios.post('/login', {
      username,
      password,
    });
    
    if (response.data.result) {
      // Store username in localStorage for persistence
      localStorage.setItem('username', username);
    }
    
    return response.data;
  } catch (error) {
    return {
      result: false,
      message: error.response?.data?.message || 'Network error'
    };
  }
};

export const signup = async (formData) => {
  try {
    const response = await axios.post('/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.result) {
      // Store username in localStorage for persistence
      localStorage.setItem('username', formData.get('username'));
    }
    
    return response.data;
  } catch (error) {
    return {
      result: false,
      message: error.response?.data?.message || 'Network error'
    };
  }
};

export const logout = () => {
  // Clear all user data from localStorage
  localStorage.removeItem('username');
  localStorage.removeItem('avatar_cid');
  // Add any other auth-related items to clear
};