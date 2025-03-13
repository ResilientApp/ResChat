import React, { useState, useEffect } from "react";
import { 
  Box, 
  Stack, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton, 
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from "react-redux";
import { CaretDown } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import Conversation from "../../components/Conversation";
import Contact from "../../components/Contact";
import SharedMessages from "../../components/SharedMessages";
import StarredMessages from "../../components/StarredMessages";
import { 
  setChatHistory, 
  updateChatHistory,
  setSelectedFriend,
  setLoading,
  setError,
  showNotification,
  hideNotification,
  clearUserData,
  setUsername
} from "../../redux/slices/app.jsx";
import FriendList from '../../components/FriendList';
import { selectFriend, initialLoadChatHistory, loadPreviousChatHistory, updateChatHistory as fetchChatUpdates } from '../../services/chat';
import { logout } from '../../services/auth';

const GeneralApp = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    sidebar = { open: false, type: "CONTACT" }, 
    selectedFriend, 
    username, 
    isLoading = false, 
    error = null,
    notification = { show: false, message: '', type: 'info' }
  } = useSelector((store) => store.app || {});
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && !username) {
      dispatch(setUsername(storedUsername));
    }
  }, [dispatch, username]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    dispatch(clearUserData());
    navigate('/auth/login');
    handleClose();
  };

  const handleFriendSelect = async (friendUsername) => {
    if (friendUsername === selectedFriend) return;
    
    dispatch(setLoading(true));
    dispatch(setSelectedFriend(friendUsername));

    try {
      // Step 1: Select the friend on the backend
      const selectResponse = await selectFriend(friendUsername);
      
      if (!selectResponse.result) {
        throw new Error(selectResponse.message || 'Failed to select friend');
      }
      
      // Step 2: Select friend on backend then load messages using loadPreviousChatHistory
      console.log('Friend selected, loading messages with loadPreviousChatHistory API');
      
      try {
        // Load messages directly using loadPreviousChatHistory
        const previousResponse = await loadPreviousChatHistory();
        console.log('Chat history response from loadPreviousChatHistory:', previousResponse);
        
        if (previousResponse.result) {
          if (previousResponse.chat_history) {
            console.log('Setting chat history from loadPreviousChatHistory:', previousResponse.chat_history);
            dispatch(setChatHistory(previousResponse.chat_history));
          } else {
            console.warn('loadPreviousChatHistory returned empty chat_history');
            dispatch(setChatHistory({}));
          }
        } else {
          console.error('Failed to load previous chat history:', previousResponse.message);
          
          // Fallback to initialLoadChatHistory only if loadPreviousChatHistory fails
          console.log('Falling back to initialLoadChatHistory...');
          const initialResponse = await initialLoadChatHistory();
          
          if (initialResponse.result && initialResponse.chat_history) {
            console.log('Setting chat history from initialLoadChatHistory:', initialResponse.chat_history);
            dispatch(setChatHistory(initialResponse.chat_history));
          } else {
            throw new Error(initialResponse.message || 'Failed to load chat history');
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        throw new Error('Failed to load chat history');
      }
    } catch (error) {
      console.error("Error in friend selection flow:", error);
      dispatch(setError(error.message));
      dispatch(showNotification({
        message: error.message,
        type: 'error'
      }));
      dispatch(setChatHistory({}));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Set up polling for chat updates when a friend is selected
  useEffect(() => {
    let intervalId;
    
    if (selectedFriend) {
      // Set up periodic polling to fetch chat history updates
      intervalId = setInterval(async () => {
        try {
          const response = await fetchChatUpdates();
          if (response.result && response.chat_history) {
            dispatch(updateChatHistory(response.chat_history));
          }
        } catch (error) {
          console.error("Error updating chat history:", error);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedFriend, dispatch]);

  return (
    <Stack sx={{ width: '100%' }}>
      {/* Header with user info */}
      <Box 
        sx={{ 
          p: 2,
          width: '100%',
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
          boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ width: 48, height: 48 }}
              src={`http://localhost:8080/ipfs/${localStorage.getItem('avatar_cid')}`} 
              alt={username || 'User'}
            />
            <Typography variant="h6">{username || 'User'}</Typography>
          </Stack>
          
          <IconButton onClick={handleClick}>
            <CaretDown />
          </IconButton>

          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* Main Content */}
      <Stack 
        direction='row' 
        sx={{ 
          width: '100%', 
          height: 'calc(100vh - 72px)'
        }}
      >
        {/* Friend List Section - Fixed width */}
        <Box sx={{ 
          width: '320px',
          height: '100%',
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
          borderRight: '1px solid',
          borderColor: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.divider,
          overflow: 'auto'
        }}>
          <FriendList 
            onSelect={handleFriendSelect} 
          />
        </Box>

        {/* Conversation Section - Flexible width */}
        <Box sx={{ 
          flexGrow: 1,
          height: '100%', 
          backgroundColor: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.background.default,
        }}>
          {isLoading ? (
            <Stack 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
            >
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading conversation...
              </Typography>
            </Stack>
          ) : selectedFriend ? (
            <Conversation />
          ) : (
            <Stack 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
            >
              <Typography variant="h6" color="text.secondary">
                Select a friend to start chatting
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Sidebar Section */}
        {sidebar.open && (
          <Box sx={{ width: '320px' }}>
            {(() => {
              switch (sidebar.type) {
                case 'CONTACT':
                  return <Contact />;
                case 'STARRED':
                  return <StarredMessages />;
                case 'SHARED':
                  return <SharedMessages />;
                default:
                  break;
              }
            })()}
          </Box>
        )}
      </Stack>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={() => dispatch(hideNotification())}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => dispatch(hideNotification())} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default GeneralApp;