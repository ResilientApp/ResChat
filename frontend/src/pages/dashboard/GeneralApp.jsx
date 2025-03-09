import React, { useState, useEffect } from "react";
import { Box, Stack, Typography, Avatar, Menu, MenuItem, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from "react-redux";
import { CaretDown } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import Conversation from "../../components/Conversation";
import Contact from "../../components/Contact";
import SharedMessages from "../../components/SharedMessages";
import StarredMessages from "../../components/StarredMessages";
import { setChatHistory } from "../../redux/slices/app.jsx";
import FriendList from '../../components/FriendList';
import { setSelectedFriend } from '../../redux/slices/app.jsx';

const GeneralApp = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sidebar, selectedFriend } = useSelector((store) => store.app);
  const username = localStorage.getItem('username');
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Initial component mount effect
  useEffect(() => {
    console.log("[GeneralApp] Component mounted");
    // Check localStorage for any pre-selected friend
    const savedFriend = localStorage.getItem('lastSelectedFriend');
    if (savedFriend && !selectedFriend) {
      console.log("[GeneralApp] Restoring last selected friend:", savedFriend);
      dispatch(setSelectedFriend(savedFriend));
    }
  }, [dispatch, selectedFriend]);

  // Effect for handling friend selection and API calls
  useEffect(() => {
    console.log("[GeneralApp] Selected friend changed:", selectedFriend);
    if (selectedFriend) {
      // Save current selection to localStorage
      localStorage.setItem('lastSelectedFriend', selectedFriend);
      
      // Show loading state
      setIsLoading(true);
      
      console.log("[GeneralApp] Preparing select_friend API call with target:", selectedFriend);
      
      // Make API call with the correct parameters expected by the backend
      fetch('http://localhost:8000/select_friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: username, // Include your username
          target_username: selectedFriend
        }),
        credentials: 'include' // Include cookies if needed for authentication
      })
      .then(res => {
        console.log("[GeneralApp] select_friend status:", res.status);
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("[GeneralApp] select_friend parsed data:", data);
        // Only if the select_friend call was successful, proceed to load chat history
        if (data.result) {
          console.log("[GeneralApp] Friend selection successful, loading chat history...");
          return fetch('http://localhost:8000/load_previous_chat_history', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: username,
              target_username: selectedFriend
            }),
            credentials: 'include' // Include cookies if needed for authentication
          });
        }
        throw new Error(data.message || 'Failed to select friend');
      })
      .then(res => {
        console.log("[GeneralApp] load_previous_chat_history status:", res.status);
        if (!res.ok) {
          throw new Error(`Chat history request failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then(chatData => {
        console.log("[GeneralApp] Chat history received:", chatData);
        if (chatData.result) {
          console.log("[GeneralApp] Updating chat history in Redux store with", 
            chatData.chat_history ? chatData.chat_history.length : 0, "messages");
          dispatch(setChatHistory(chatData.chat_history || []));
        } else {
          console.warn("[GeneralApp] Failed to load chat history:", chatData.message);
          // Initialize with empty chat history on failure
          dispatch(setChatHistory([]));
        }
      })
      .catch(err => {
        console.error("[GeneralApp] Error in friend selection flow:", err);
        // Optionally show an error message to the user
        dispatch(setChatHistory([])); // Reset chat history on error
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [selectedFriend, dispatch, username]);

  // Modified handler with navigation awareness
  const handleFriendSelect = (friendUsername) => {
    console.log("[GeneralApp] Friend selection triggered:", friendUsername, selectedFriend);
    if (friendUsername !== selectedFriend) {  
      dispatch(setSelectedFriend(friendUsername));
      console.log(selectedFriend, "aa")
      if (window.location.pathname !== '/app') {
        navigate('/app');
      }
    }
  };

  return (
    <Stack sx={{ width: '100%' }}>
      {/* User Profile Header */}
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
            <MenuItem onClick={() => { handleClose(); navigate('/auth/login'); }}>Logout</MenuItem>
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
            selectedFriend={selectedFriend}
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
              <Typography variant="h6" color="text.secondary">
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
    </Stack>
  );
};

export default GeneralApp;