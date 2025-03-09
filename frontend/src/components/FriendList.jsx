import React, { useState, useEffect } from 'react';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, ListItemButton } from '@mui/material';
import { faker } from '@faker-js/faker';

const FriendList = ({ onSelect, selectedFriend }) => {
  const [friends, setFriends] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[FriendList] Component mounted, fetching friend list");
    setLoading(true);
    
    fetch('http://localhost:8000/get_friend_list')
      .then(res => {
        console.log("[FriendList] Friend list response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("[FriendList] Friend list data:", data);
        if (data.result) {
          setFriends(data.friend_list);
        } else {
          console.warn("[FriendList] Failed to get friend list:", data.message);
        }
      })
      .catch(err => console.error("[FriendList] Failed to fetch friend list", err))
      .finally(() => setLoading(false));
  }, []);

  // Convert friend object to array of entries
  const friendEntries = Object.entries(friends);

  console.log("[FriendList] Rendering with selected friend:", selectedFriend);
  console.log("[FriendList] Available friends:", friendEntries.map(([username]) => username));

  return (
    <List sx={{ padding: 0 }}>
      {loading ? (
        <ListItem>
          <ListItemText primary="Loading friends..." />
        </ListItem>
      ) : friendEntries.length === 0 ? (
        <ListItem>
          <ListItemText primary="No friends available" />
        </ListItem>
      ) : (
        friendEntries.map(([username, info], index) => (
          <React.Fragment key={username}>
            <ListItemButton 
              onClick={() => onSelect && onSelect(username)}
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
                  src={info.avatar_cid ? `http://localhost:8080/ipfs/${info.avatar_cid}` : faker.image.avatar()}
                  alt={info.nick_name || username}
                />
              </ListItemAvatar>
              <ListItemText 
                primary={info.nick_name || username} 
                primaryTypographyProps={{
                  fontWeight: selectedFriend === username ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
            {index < friendEntries.length - 1 && <Divider />}
          </React.Fragment>
        ))
      )}
    </List>
  );
};

export default FriendList;