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
  const { sidebar, selectedFriend, username } = useSelector((store) => store.app);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && !username) {
      dispatch(setUsername(storedUsername));
    }
  }, [dispatch, username]);

  const handleFriendSelect = async (friendUsername) => {
    if (friendUsername !== selectedFriend) {
      dispatch(setSelectedFriend(friendUsername));
      setIsLoading(true);

      try {
        // First API call - select_friend
        const selectResponse = await fetch('http://localhost:8000/select_friend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: username,
            target_username: friendUsername
          }),
          credentials: 'include'
        });

        if (!selectResponse.ok) {
          throw new Error(`Server responded with status: ${selectResponse.status}`);
        }

        const selectData = await selectResponse.json();
        if (!selectData.result) {
          throw new Error(selectData.message || 'Failed to select friend');
        }

        // Second API call - load chat history
        const historyResponse = await fetch('http://localhost:8000/load_previous_chat_history', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            target_username: friendUsername
          }),
          credentials: 'include'
        });

        if (!historyResponse.ok) {
          throw new Error(`Chat history request failed with status: ${historyResponse.status}`);
        }

        const chatData = await historyResponse.json();
        if (chatData.result) {
          dispatch(setChatHistory(chatData.chat_history || []));
        } else {
          dispatch(setChatHistory([]));
        }

      } catch (err) {
        console.error("[GeneralApp] Error in friend selection flow:", err);
        dispatch(setChatHistory([]));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Stack sx={{ width: '100%' }}>
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