import { Avatar, Box, Divider, IconButton, Stack, Typography, Paper } from '@mui/material'
import React, { useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import { Bell, CaretLeft, Image, Info, Key, Keyboard, Lock, Note, PencilCircle, User } from 'phosphor-react';
import { useSelector } from 'react-redux';
import Shortcuts from '../../sections/settings/Shortcuts';
import ProfileForm from '../../sections/settings/ProfileForm';
import axios from '../../utils/axios';

const Settings = () => {
    const theme = useTheme();
    const { username } = useSelector((state) => state.app);
    const [avatarCid, setAvatarCid] = useState(localStorage.getItem('avatar_cid'));
    const [openShortcuts, setOpenShortcuts] = useState(false);
    const [selectedOption, setSelectedOption] = useState('profile');

    useEffect(() => {
        // Update avatar CID if it changes in localStorage
        const handleStorageChange = () => {
            setAvatarCid(localStorage.getItem('avatar_cid'));
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleOpenShortcuts = () => {
        setOpenShortcuts(true);
    }

    const handleCloseShortcuts = () => {
        setOpenShortcuts(false);
    }

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    }

    const list = [
        {
            key: 0,
            icon: <User size={20}/>,
            title: 'Profile',
            option: 'profile',
            onClick: () => handleOptionSelect('profile')
        },
        {
            key: 1,
            icon: <Image size={20}/>,
            title: 'Chat Wallpaper',
            option: 'wallpaper',
            onClick: () => handleOptionSelect('wallpaper')
        }
    ]

    const renderRightPanel = () => {
        switch (selectedOption) {
            case 'profile':
                return (
                    <Box p={4} width="100%">
                        <Typography variant="h5" mb={4}>Profile Settings</Typography>
                        <ProfileForm />
                    </Box>
                );
            case 'wallpaper':
                return (
                    <Box p={4}>
                        <Typography variant="h5">Chat Wallpaper</Typography>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                            Wallpaper settings coming soon.
                        </Typography>
                    </Box>
                );
            default:
                return (
                    <Box p={4} display="flex" alignItems="center" justifyContent="center">
                        <Typography>Select an option from the sidebar</Typography>
                    </Box>
                );
        }
    }

    return (
        <>
            <Stack direction='row' sx={{ width: '100%', height: '100%' }}>
                {/* Left panel */}
                <Box
                    className='scrollbar'
                    sx={{
                        overflow: 'auto',
                        height: '100vh',
                        width: 320,
                        backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
                        boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)'
                    }}
                >
                    <Stack p={4} spacing={5}>
                        {/* Header */}
                        <Stack direction={'row'} alignItems='center' spacing={3}>
                            <IconButton>
                                <CaretLeft size={24} color='#4B4B4B' />
                            </IconButton>
                            <Typography variant='h6'>Settings</Typography>
                        </Stack>
                        
                        {/* Profile */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                                src={avatarCid ? `${axios.defaults.baseURL}/profile_pictures/${avatarCid}.jpg` : null}
                                alt={username || "User"}
                                sx={{ width: 56, height: 56 }}
                            >
                                {!avatarCid && <User size={30} weight="light" />}
                            </Avatar>
                            <Typography variant="h6">
                                {username || "User"}
                            </Typography>
                        </Stack>
                        
                        {/* List of options */}
                        <Stack spacing={2}>
                            {list.map(({ key, icon, title, option, onClick }) => (
                                <div key={key}>
                                    <Stack 
                                        direction='row' 
                                        spacing={2}
                                        p={2}
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            backgroundColor: selectedOption === option 
                                                ? theme.palette.primary.lighter
                                                : 'transparent',
                                            color: selectedOption === option
                                                ? theme.palette.primary.main
                                                : 'inherit',
                                            '&:hover': {
                                                backgroundColor: selectedOption === option
                                                    ? theme.palette.primary.lighter
                                                    : theme.palette.action.hover,
                                            }
                                        }}
                                        onClick={onClick}
                                    >
                                        {icon}
                                        <Typography variant='body2'>{title}</Typography>
                                    </Stack>
                                    {key < list.length - 1 && <Divider sx={{ my: 1 }} />}
                                </div>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
                
                {/* Right panel */}
                <Box
                    sx={{
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                        backgroundColor: theme.palette.mode === 'light' 
                            ? theme.palette.background.default
                            : theme.palette.background.paper
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            height: '100%',
                            maxWidth: 800,
                            mx: 'auto',
                            backgroundColor: 'transparent'
                        }}
                    >
                        {renderRightPanel()}
                    </Paper>
                </Box>
            </Stack>
            
            {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts} />}
        </>
    )
}

export default Settings