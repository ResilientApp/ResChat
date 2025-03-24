import { Avatar, Box, Typography, IconButton, Divider, Stack } from '@mui/material'
import { CaretDown, MagnifyingGlass, Phone, VideoCamera } from 'phosphor-react'
import React from 'react';
import { useTheme } from "@mui/material/styles";
import StyledBadge from '../StyledBadge';
import { toggleSidebar } from '../../redux/slices/app';
import { useDispatch, useSelector } from 'react-redux';

const Header = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { selectedFriend, friendList = {} } = useSelector((state) => state.app || {});
  
  // Get the friend information with null checks
  const friendInfo = selectedFriend && friendList ? friendList[selectedFriend] : null;
  const displayName = friendInfo?.nick_name || selectedFriend || '';
  const avatarCid = friendInfo?.avatar_cid || null;

  return (
    <Box p={2} sx={{ width:'100%', backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper, boxShadow:'0px 0px 2px rgba(0,0,0,0.25)'}}>
      <Stack 
        alignItems={'center'} 
        direction='row' 
        justifyContent={'space-between'}
        sx={{width:'100%', height:'100%'}}
      >
        <Stack 
          onClick={() => {
            dispatch(toggleSidebar());
          }} 
          direction={'row'} 
          spacing={2}
        >
          <Box>
            <StyledBadge 
              overlap="circular"
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              variant="dot"
            >
              {avatarCid ? (
                <Avatar 
                  alt={displayName} 
                  src={`http://localhost:8080/ipfs/${avatarCid}`}
                />
              ) : (
                <Avatar>
                  {displayName && displayName.length > 0 ? displayName.slice(0, 1).toUpperCase() : '?'}
                </Avatar>
              )}
            </StyledBadge>
          </Box>
          <Stack spacing={0.2}>
            <Typography variant='h4'>
              {displayName}
            </Typography>
            
          </Stack>
        </Stack>
        <Stack direction='row' alignItems='center' spacing={3}>
          <Divider orientation='vertical' flexItem/>
          <IconButton>
            <CaretDown/>
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  )
}

export default Header