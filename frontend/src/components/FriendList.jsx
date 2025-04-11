import React, { useState, useEffect } from 'react';
import { 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider, 
  ListItemButton,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { DotsThreeVertical, Pencil, UserMinus, UserPlus } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setSelectedFriend, 
  setFriendList,
  updateFriendNickname,
  removeFriend,
  showNotification
} from '../redux/slices/app.jsx';
import { getFriendList, changeNickname, deleteFriend, addFriend } from '../services/chat';

const FriendList = ({ onSelect }) => {
  const dispatch = useDispatch();
  const { friendList = {}, selectedFriend, isLoading = false } = useSelector((state) => state.app || {});
  
  // Menu state for friend actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFriendForAction, setSelectedFriendForAction] = useState(null);
  const open = Boolean(anchorEl);
  
  // Dialog states
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [newFriendNickname, setNewFriendNickname] = useState('');

  // Load friend list on component mount
  useEffect(() => {
    const loadFriendList = async () => {
      const response = await getFriendList();
      if (response.result) {
        // Ensure we never set friend_list to null/undefined
        dispatch(setFriendList(response.friend_list || {}));
      } else {
        // If there's an error, make sure friend list is at least an empty object
        dispatch(setFriendList({}));
        dispatch(showNotification({ 
          message: response.message || 'Failed to load friends', 
          type: 'error' 
        }));
      }
    };
    
    loadFriendList();
  }, [dispatch]);

  // Menu handlers
  const handleOpenMenu = (event, username) => {
    setAnchorEl(event.currentTarget);
    setSelectedFriendForAction(username);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedFriendForAction(null);
  };

  // Nickname dialog handlers
  const handleOpenNicknameDialog = () => {
    const currentNickname = friendList[selectedFriendForAction]?.nick_name || selectedFriendForAction;
    setNewNickname(currentNickname);
    setNicknameDialogOpen(true);
    handleCloseMenu();
  };

  const handleCloseNicknameDialog = () => {
    setNicknameDialogOpen(false);
    setNewNickname('');
  };

  const handleChangeNickname = async () => {
    if (newNickname.trim() === '') {
      dispatch(showNotification({ 
        message: 'Nickname cannot be empty', 
        type: 'warning' 
      }));
      return;
    }

    const response = await changeNickname(selectedFriendForAction, newNickname);
    if (response.result) {
      dispatch(updateFriendNickname({ 
        username: selectedFriendForAction, 
        nickname: newNickname 
      }));
      dispatch(showNotification({ 
        message: response.message || 'Nickname changed successfully', 
        type: 'success' 
      }));
    } else {
      dispatch(showNotification({ 
        message: response.message || 'Failed to change nickname', 
        type: 'error' 
      }));
    }

    handleCloseNicknameDialog();
  };

  // Delete friend handler
  const handleDeleteFriend = async () => {
    const response = await deleteFriend(selectedFriendForAction);
    if (response.result) {
      dispatch(removeFriend(selectedFriendForAction));
      dispatch(showNotification({ 
        message: response.message || 'Friend removed successfully', 
        type: 'success' 
      }));
    } else {
      dispatch(showNotification({ 
        message: response.message || 'Failed to remove friend', 
        type: 'error' 
      }));
    }

    handleCloseMenu();
  };

  // Add friend dialog handlers
  const handleOpenAddFriendDialog = () => {
    setAddFriendDialogOpen(true);
  };

  const handleCloseAddFriendDialog = () => {
    setAddFriendDialogOpen(false);
    setNewFriendUsername('');
    setNewFriendNickname('');
  };

  const handleAddFriend = async () => {
    if (newFriendUsername.trim() === '') {
      dispatch(showNotification({ 
        message: 'Username cannot be empty', 
        type: 'warning' 
      }));
      return;
    }

    const response = await addFriend(newFriendUsername, newFriendNickname || newFriendUsername);
    if (response.result) {
      // Refresh friend list after adding
      const friendListResponse = await getFriendList();
      if (friendListResponse.result) {
        dispatch(setFriendList(friendListResponse.friend_list));
      }
      
      dispatch(showNotification({ 
        message: response.message || 'Friend added successfully', 
        type: 'success' 
      }));
    } else {
      dispatch(showNotification({ 
        message: response.message || 'Failed to add friend', 
        type: 'error' 
      }));
    }

    handleCloseAddFriendDialog();
  };

  // Select friend handler
  const handleSelectFriend = (username) => {
    dispatch(setSelectedFriend(username));
    if (onSelect) {
      onSelect(username);
    }
  };

  // Convert friend object to array of entries with null check
  const friendEntries = friendList ? Object.entries(friendList) : [];
  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6">Friends</Typography>
        <IconButton onClick={handleOpenAddFriendDialog} color="primary">
          <UserPlus />
        </IconButton>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
          <CircularProgress />
        </Box>
      ) : friendEntries.length === 0 ? (
        <Box sx={{ padding: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No friends yet. Add someone to start chatting!
          </Typography>
        </Box>
      ) : (
        <List sx={{ padding: 0 }}>
          {friendEntries.map(([username, info], index) => (
            <React.Fragment key={username}>
              <ListItemButton 
                onClick={() => handleSelectFriend(username)}
                selected={selectedFriend === username}
                sx={{
                  bgcolor: selectedFriend === username ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: selectedFriend === username ? 'action.selected' : 'action.hover',
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={info.avatar_cid ? `http://localhost:8000/profile_pictures/${info.avatar_cid}.jpg` : null}
                    alt={info.nick_name || username}
                  />
                </ListItemAvatar>
                <ListItemText 
                  primary={info.nick_name || username} 
                  primaryTypographyProps={{
                    fontWeight: selectedFriend === username ? 'bold' : 'normal'
                  }}
                />
                <IconButton 
                  edge="end" 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleOpenMenu(e, username);
                  }}
                >
                  <DotsThreeVertical />
                </IconButton>
              </ListItemButton>
              {index < friendEntries.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Friend actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleOpenNicknameDialog}>
          <Pencil size={20} style={{ marginRight: 8 }} />
          Change Nickname
        </MenuItem>
        <MenuItem onClick={handleDeleteFriend}>
          <UserMinus size={20} style={{ marginRight: 8 }} />
          Remove Friend
        </MenuItem>
      </Menu>

      {/* Change nickname dialog */}
      <Dialog open={nicknameDialogOpen} onClose={handleCloseNicknameDialog}>
        <DialogTitle>Change Nickname</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Nickname"
            type="text"
            fullWidth
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNicknameDialog}>Cancel</Button>
          <Button onClick={handleChangeNickname} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add friend dialog */}
      <Dialog open={addFriendDialogOpen} onClose={handleCloseAddFriendDialog}>
        <DialogTitle>Add Friend</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            value={newFriendUsername}
            onChange={(e) => setNewFriendUsername(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Nickname (optional)"
            type="text"
            fullWidth
            value={newFriendNickname}
            onChange={(e) => setNewFriendNickname(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddFriendDialog}>Cancel</Button>
          <Button onClick={handleAddFriend} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FriendList;