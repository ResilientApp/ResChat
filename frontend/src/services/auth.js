import axios from '../utils/axios';

export const login = async (username, password) => {
  try {
    const response = await axios.post('/login', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    return {
      result: false,
      message: error.response?.data?.message || 'Network error'
    };
  }
};

export const signup = async (username, password, avatarLocation) => {
  try {
    const response = await axios.post('/signup', {
      username,
      password,
      avatar_location: avatarLocation
    });
    return response.data;
  } catch (error) {
    return {
      result: false,
      message: error.response?.data?.message || 'Network error'
    };
  }
};
