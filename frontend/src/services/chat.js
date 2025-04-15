import axios from '../utils/axios';

// Get the current user's friend list
export const getFriendList = async () => {
  try {
    const response = await axios.get('/get_friend_list');
    return response.data;
  } catch (error) {
    console.error('Error fetching friend list:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to fetch friend list',
      friend_list: {}
    };
  }
};

// Select a friend to chat with
export const selectFriend = async (targetUsername) => {
  try {
    const response = await axios.post('/select_friend', {
      target_username: targetUsername
    });
    return response.data;
  } catch (error) {
    console.error('Error selecting friend:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to select friend'
    };
  }
};

// Change a friend's nickname
export const changeNickname = async (targetUsername, newNickname) => {
  try {
    const response = await axios.put('/change_nickname', {
      target_username: targetUsername,
      new_nickname: newNickname
    });
    return response.data;
  } catch (error) {
    console.error('Error changing nickname:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to change nickname'
    };
  }
};

// Delete a friend
export const deleteFriend = async (targetUsername) => {
  try {
    const response = await axios.delete('/delete_friend', {
      data: { target_username: targetUsername }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting friend:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to delete friend'
    };
  }
};

// Add a new friend
export const addFriend = async (targetUsername, nickname) => {
  try {
    const response = await axios.post('/add_friend', {
      target_username: targetUsername,
      nickname: nickname
    });
    return response.data;
  } catch (error) {
    console.error('Error adding friend:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to add friend'
    };
  }
};

// Send a text message
export const sendTextMessage = async (plainText) => {
  try {
    const response = await axios.post('/send_text', {
      plain_text: plainText
    });
    return response.data;
  } catch (error) {
    console.error('Error sending text message:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to send message'
    };
  }
};

// Send a file
export const sendFile = async (filePath) => {
  try {
    const response = await axios.post('/send_file', {
      file_path: filePath
    });
    return response.data;
  } catch (error) {
    console.error('Error sending file:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to send file, Retrying...'
    };
  }
};

// Upload a file and get a temporary file path to send
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    console.log("Sedning file to temp uplaod")
    const response = await axios.post('/upload_temp_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('Temp File Upload Successfull', response.data)
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to upload file'
    };
  }
};

// Get real-time updates to chat history
export const updateChatHistory = async () => {
  try {
    const response = await axios.get('/update_chat_history');
    return response.data;
  } catch (error) {
    console.error('Error updating chat history:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to update chat history',
      chat_history: {}
    };
  }
};

// Get initial chat history when selecting a friend
export const initialLoadChatHistory = async () => {
  try {
    const response = await axios.get('/initial_load_chat_history');
    return response.data;
  } catch (error) {
    console.error('Error loading initial chat history:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to load chat history',
      chat_history: {}
    };
  }
};

// Load previous chat history (older messages)
export const loadPreviousChatHistory = async () => {
  try {
    const response = await axios.get('/load_previous_chat_history');
    return response.data;
  } catch (error) {
    console.error('Error loading previous chat history:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to load previous messages',
      chat_history: {}
    };
  }
};

// Download a file
export const downloadFile = async (savePath, fileInfo) => {
  try {
    const response = await axios.post('/download_file', {
      save_path: savePath,
      file_info: fileInfo
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      result: false,
      message: error.response?.data?.message || 'Failed to download file'
    };
  }
};