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
    if (storedUsername) {
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
      const selectResponse = await selectFriend(friendUsername);
      
      if (!selectResponse.result) {
        throw new Error(selectResponse.message || 'Failed to select friend');
      }
      
      // After successful friend selection, load chat history
      dispatch(setChatHistory({})); // Clear existing chat history
      
    } catch (error) {
      console.error("Error selecting friend:", error);
      dispatch(setError(error.message));
      dispatch(showNotification({
        message: error.message,
        type: 'error'
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

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
              src = {`profile_pictures/${localStorage.getItem('user_cid')}.jpg`}
              alt={username || 'User DP'}
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