import React from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Button,
  Tooltip,
  Link,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { GetApp, PictureAsPdf, Description, TableChart, Image, InsertDriveFile } from '@mui/icons-material';
import { DotsThreeVertical, DownloadSimple, Copy } from 'phosphor-react';
import { format } from 'date-fns';
import { downloadFile } from '../../services/chat';

const Message = ({ messages }) => {
  const theme = useTheme();
  const { friendList, selectedFriend, username } = useSelector((state) => state.app);
  
  const [selectedMessage, setSelectedMessage] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [downloadPath, setDownloadPath] = React.useState('');
  
  const friendInfo = selectedFriend ? friendList[selectedFriend] : null;
  
  const handleOpenMenu = (event, message) => {
    setSelectedMessage(message);
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };
  
  const handleCopyMessage = () => {
    if (selectedMessage && selectedMessage.message_type === 'TEXT') {
      navigator.clipboard.writeText(selectedMessage.message)
        .then(() => {
          console.log('Message copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy message: ', err);
        });
    }
    handleCloseMenu();
  };
  
  const handleDownloadFile = async () => {
    if (selectedMessage && selectedMessage.message_type === 'FILE') {
      try {
        // Ask user for download location
        // For now, we're using a fixed path - this would ideally use a file dialog
        const defaultPath = `/home/downloads/${selectedMessage.message.file_name}`;
        console.log("FIle Info", selectedMessage.message)
        const response = await downloadFile(defaultPath, selectedMessage.message);
        if (response.result) {
          console.log('File downloaded successfully:', response.message);
        } else {
          console.error('Failed to download file:', response.message);
        }
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
    handleCloseMenu();
  };
  
  // Function to format message timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp;
    }
  };
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PictureAsPdf />;
      case 'doc':
      case 'docx':
        return <Description />;
      case 'xls':
      case 'xlsx':
        return <TableChart />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image />;
      default:
        return <InsertDriveFile />;
    }
  };
  
  return (
    <Box p={3}>
      <Stack spacing={3}>
        {messages.map((msg, index) => {
          
          
          // Handle various ways the sender flag might be represented
          const isSender = 
            msg.sender === true || 
            msg.sender === 'true' || 
            msg.sender === 1 || 
            msg.sender === '1';
          
          
          
          return (
            <Stack 
              key={`${msg.time_stamp}-${index}`} 
              direction="row" 
              justifyContent={isSender ? 'flex-end' : 'flex-start'}
              alignItems="flex-start"
              spacing={2}
            >
              {/* Avatar for received messages */}
              {!isSender && (
                <Avatar 
                  src={friendInfo?.avatar_cid ? `http://localhost:8080/ipfs/${friendInfo.avatar_cid}` : null}
                  alt={friendInfo?.nick_name || selectedFriend}
                  sx={{ width: 32, height: 32 }}
                />
              )}
              
              <Box sx={{ maxWidth: '70%' }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: isSender 
                      ? theme.palette.primary.main 
                      : theme.palette.mode === 'light' ? '#F8F9FA' : theme.palette.background.paper,
                    color: isSender ? '#fff' : theme.palette.text.primary,
                    position: 'relative'
                  }}
                >
                  {/* Text message */}
                  {msg.message_type === 'TEXT' && (
                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                      {msg.message}
                    </Typography>
                  )}
                  
                  {/* File message */}
                  {msg.message_type === 'FILE' && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getFileIcon(msg.message.file_name)}
                      <Stack direction="column" sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {msg.message.file_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Size: {(msg.message.file_size / 1024).toFixed(2)} KB
                        </Typography>
                      </Stack>
                      <Tooltip title="Download">
                        <IconButton
                          onClick={() => {
                            setSelectedMessage(msg);
                            handleDownloadFile();
                          }}
                          color={isSender ? 'inherit' : 'primary'}
                          aria-label="download file"
                        >
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                  
                  {/* Message timestamp */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5, 
                      color: isSender ? 'rgba(255,255,255,0.8)' : theme.palette.text.secondary,
                      textAlign: 'right'
                    }}
                  >
                    {formatMessageTime(msg.time_stamp)}
                  </Typography>
                </Paper>
              </Box>
              
              {/* Options menu button */}
              <IconButton 
                size="small"
                onClick={(e) => handleOpenMenu(e, msg)}
                sx={{ 
                  opacity: 0.7,
                  '&:hover': { opacity: 1 }
                }}
              >
                <DotsThreeVertical size={20} />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>
      
      {/* Message actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedMessage?.message_type === 'TEXT' && (
          <MenuItem onClick={handleCopyMessage}>
            <Copy size={20} style={{ marginRight: 8 }} />
            Copy Message
          </MenuItem>
        )}
        
        {selectedMessage?.message_type === 'FILE' && (
          <MenuItem onClick={handleDownloadFile}>
            <DownloadSimple size={20} style={{ marginRight: 8 }} />
            Download File
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Message;