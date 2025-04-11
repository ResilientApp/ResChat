import { Avatar, Box, Divider, IconButton, Stack, Typography } from '@mui/material'
import React, {useState} from 'react';
import { useTheme } from "@mui/material/styles";
import { Bell, CaretLeft, Image, Info, Key, Keyboard, Lock, Note, PencilCircle } from 'phosphor-react';
import { useSelector } from 'react-redux';
import Shortcuts from '../../sections/settings/Shortcuts';

const Settings = () => {

    const theme = useTheme();
    const { username } = useSelector((state) => state.app);

    const [openShortcuts, setOpenShortcuts] = useState(false);

    const handleOpenShortcuts = ()=>{
        setOpenShortcuts(true);
    }

    const handleCloseShortcuts = ()=>{
        setOpenShortcuts(false);
    }

    const list = [
      {
        key:0,
        icon: <Image size={20}/>,
        title: 'Chat Wallpaper',
        onclick: () =>{}
      }
    ]

  return (
    <>
    <Stack direction='row' sx={{width:'100%'}}>
        {/* Left panel */}
        <Box className='scrollbar' sx={{overflow:'scroll', height:'100vh', width:320, 
        backgroundColor:theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background,
        boxShadow:'0px 0px 2px rgba(0)'}}>
          
            <Stack p={4} spacing={5}>
                {/* Header */}
                <Stack direction={'row'} alignItems='center' spacing={3}>
                    <IconButton>
                        <CaretLeft size={24} color='#4B4B4B'/>
                    </IconButton>
                    <Typography variant='h6'>Settings</Typography>
                </Stack>
                {/* Profile */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar 
                    src={localStorage.getItem('user_cid') ? `http://localhost:8000/profile_pictures/${localStorage.getItem('user_cid')}.jpg` : null}
                    alt={username || "User"}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Typography variant="h6">
                    {username || "User"}
                  </Typography>
                </Stack>
                {/* List of options */}
                <Stack spacing={4}>
                    {list.map(({key, icon, title, onclick}) => (
                        <Stack key={key} spacing={2} sx={{cursor:'pointer'}} onClick={onclick}>
                            <Stack direction='row' spacing={2} >
                                {icon}
                                <Typography variant='body2'>{title}</Typography>
                            </Stack>
                            {key !== 7 && <Divider/>}
                        </Stack>
                    ))}
                </Stack>
            </Stack>
            
        </Box>
        {/* Right panel */}
        
    </Stack>
    {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts}/>}
     
    </>
  )
}

export default Settings