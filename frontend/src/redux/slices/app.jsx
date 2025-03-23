import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sidebar: {
        open: false,
        type: "CONTACT", // can be CONTACT, STARRED, SHARED
    },
    username: localStorage.getItem('username') || null,
    selectedFriend: null,
    chatHistory: {},
    // Initialize with empty object to prevent null/undefined errors
    friendList: {},
    isLoading: false,
    error: null,
    notification: {
        show: false,
        message: '',
        type: 'info' // 'info', 'success', 'warning', 'error'
    }
};

const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        // Sidebar actions
        toggleSidebar(state) {
            state.sidebar.open = !state.sidebar.open;
        },
        updateSidebarType(state, action) {
            state.sidebar.type = action.payload.type;
        },
        
        // User actions
        setUsername(state, action) {
            console.log("Action received:", action);
            state.username = action.payload;
            localStorage.setItem('username', action.payload);
        },
        clearUserData(state) {
            state.username = null;
            state.selectedFriend = null;
            state.chatHistory = {};
            state.friendList = {};
            localStorage.removeItem('username');
            localStorage.removeItem('avatar_cid');
        },
        
        // Friend actions
        setSelectedFriend(state, action) {
            // Clear chat history when changing friends
            state.selectedFriend = action.payload;
            state.chatHistory = {};
        },
        setFriendList(state, action) {
            // Ensure friendList is never null/undefined
            state.friendList = action.payload || {};
        },
        updateFriendNickname(state, action) {
            const { username, nickname } = action.payload;
            if (state.friendList[username]) {
                state.friendList[username].nick_name = nickname;
            }
        },
        removeFriend(state, action) {
            const username = action.payload;
            if (state.friendList[username]) {
                delete state.friendList[username];
            }
            if (state.selectedFriend === username) {
                state.selectedFriend = null;
                state.chatHistory = {};
            }
        },
        
        // Chat history actions
        setChatHistory(state, action) {
            if (!state.selectedFriend) {
                console.warn('Attempted to set chat history without selected friend');
                return;
            }

            const newChatHistory = action.payload || {};
            
            // Validate and sanitize incoming chat history
            const validChatHistory = {};
            
            Object.entries(newChatHistory).forEach(([pageNum, messages]) => {
                const pageNumber = parseInt(pageNum);
                if (isNaN(pageNumber)) return;
                
                if (!Array.isArray(messages)) {
                    validChatHistory[pageNumber] = [];
                    return;
                }
                
                validChatHistory[pageNumber] = messages.filter(msg => 
                    msg && 
                    msg.sender !== undefined &&
                    msg.message_type && 
                    msg.message && 
                    msg.time_stamp
                );
            });
            
            state.chatHistory = validChatHistory;
        },
        updateChatHistory(state, action) {
            // Deep merge new chat history with existing one
            const newChatHistory = action.payload || {};
            console.log('Updating chat history with:', newChatHistory);
            
            // For each page in the new chat history
            Object.entries(newChatHistory).forEach(([pageNum, messages]) => {
                // If we don't have this page yet, create it
                if (!state.chatHistory[pageNum]) {
                    state.chatHistory[pageNum] = [];
                }
                
                // Only add messages that aren't already in the page
                // This assumes messages have unique timestamps
                if (Array.isArray(messages)) {
                    const existingTimestamps = new Set(
                        state.chatHistory[pageNum]
                            .filter(msg => msg && msg.time_stamp)
                            .map(msg => msg.time_stamp)
                    );
                    
                    messages.forEach(msg => {
                        if (msg && msg.time_stamp && !existingTimestamps.has(msg.time_stamp)) {
                            state.chatHistory[pageNum].push(msg);
                        }
                    });
                }
            });
            
            console.log('Updated chat history:', state.chatHistory);
        },
        addMessage(state, action) {
            const { pageNumber, message } = action.payload;
            
            if (!message) {
                console.error('Attempted to add empty message');
                return;
            }
            
            // Log what we're adding
            console.log('Adding message to Redux store:', { pageNumber, message });
            
            // Initialize the page array if it doesn't exist
            if (!state.chatHistory) {
                state.chatHistory = {};
            }
            
            if (!state.chatHistory[pageNumber]) {
                state.chatHistory[pageNumber] = [];
            }
            
            // Check for duplicates (based on timestamp or message content)
            const isDuplicate = state.chatHistory[pageNumber].some(msg => 
                (msg.time_stamp && msg.time_stamp === message.time_stamp) || 
                (msg.message_type === 'TEXT' && msg.message === message.message)
            );
            
            if (!isDuplicate) {
                // Add message to the appropriate page
                state.chatHistory[pageNumber].push(message);
                console.log('Message added successfully to page', pageNumber);
            } else {
                console.log('Skipped duplicate message:', message);
            }
        },
        
        // Loading state
        setLoading(state, action) {
            state.isLoading = action.payload;
        },
        
        // Error handling
        setError(state, action) {
            state.error = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
        
        // Notification
        showNotification(state, action) {
            state.notification = {
                show: true,
                message: action.payload.message,
                type: action.payload.type || 'info'
            };
        },
        hideNotification(state) {
            state.notification.show = false;
        }
    }
});

// Export all actions
export const { 
    toggleSidebar, 
    updateSidebarType, 
    setUsername,
    clearUserData,
    setSelectedFriend, 
    setFriendList,
    updateFriendNickname,
    removeFriend,
    setChatHistory,
    updateChatHistory,
    addMessage,
    setLoading,
    setError,
    clearError,
    showNotification,
    hideNotification
} = slice.actions;

export const appReducer = slice.reducer;