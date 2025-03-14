import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Fab, 
  IconButton, 
  InputAdornment, 
  Stack, 
  TextField, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { styled, useTheme } from "@mui/material/styles";
import { 
  LinkSimple, 
  PaperPlaneTilt, 
  Smiley, 
  Camera, 
  File as FileIcon, 
  Image, 
  Sticker, 
  User,
  X
} from 'phosphor-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useDispatch, useSelector } from 'react-redux';
import { sendTextMessage, sendFile, uploadFile, loadPreviousChatHistory } from '../../services/chat';
import { addMessage, showNotification, setChatHistory } from '../../redux/slices/app.jsx';

const StyledInput = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    paddingTop: '12px',
    paddingBottom: '12px',
  }  
}));

const FilePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  maxWidth: '200px',
}));

const MessageInput = ({ value, onChange, onKeyPress, onSend, setOpenPicker, inputRef }) => {
  const [openAction, setOpenAction] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Logic to handle the selected file
      handleFileUpload(selectedFile);
    }
  };
  
  const handleFileUpload = async (file) => {
    try {
      // First upload the file to get a temporary path
      const uploadResponse = await uploadFile(file);
      
      if (uploadResponse.result) {
        // Then send the file using the temporary path
        const sendResponse = await sendFile(uploadResponse.file_path);
        
        if (sendResponse.result) {
          dispatch(showNotification({
            message: 'File sent successfully',
            type: 'success'
          }));
        } else {
          throw new Error(sendResponse.message || 'Failed to send file');
        }
      } else {
        throw new Error(uploadResponse.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      dispatch(showNotification({
        message: error.message || 'Failed to send file',
        type: 'error'
      }));
    }
  };
  
  const Actions = [
    {
      color: '#4da5fe',
      icon: <Image size={24} />,
      y: 102,
      title: 'Image',
      onClick: () => fileInputRef.current?.click()
    },
    {
      color: '#1b8cfe',
      icon: <Sticker size={24} />,
      y: 172,
      title: 'Sticker',
      onClick: () => {}
    },
    {
      color: '#0172e4',
      icon: <Camera size={24} />,
      y: 242,
      title: 'Camera',
      onClick: () => {}
    },
    {
      color: '#0159b2',
      icon: <FileIcon size={24} />,
      y: 312,
      title: 'Document',
      onClick: () => fileInputRef.current?.click()
    },
    {
      color: '#013f7f',
      icon: <User size={24} />,
      y: 382,
      title: 'Contact',
      onClick: () => {}
    }
  ];
  
  return (
    <StyledInput 
      fullWidth 
      placeholder='Write a message...' 
      variant='filled' 
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      inputRef={inputRef}
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <Stack sx={{ width: 'max-content' }}>
            <Stack sx={{ position: 'relative', display: openAction ? 'inline-block' : 'none' }}>
              {Actions.map((el, index) => (
                <Tooltip key={index} placement='right' title={el.title}>
                  <Fab 
                    size="small"
                    sx={{ position: 'absolute', top: -el.y, backgroundColor: el.color, color: '#fff' }}
                    onClick={() => {
                      el.onClick();
                      setOpenAction(false);
                    }}
                  >
                    {el.icon}
                  </Fab>
                </Tooltip>
              ))}
            </Stack>
            <InputAdornment position="start">
              <IconButton onClick={() => {
                setOpenAction((prev) => !prev);
              }}>
                <LinkSimple />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </InputAdornment>
          </Stack>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => {
              setOpenPicker((prev) => !prev);
            }}>
              <Smiley />
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  );
};

const Footer = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [openPicker, setOpenPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { selectedFriend, chatHistory } = useSelector((state) => state.app);
  const inputRef = useRef(null);
  const chatHistoryRef = useRef(chatHistory);
  
  // Update chatHistoryRef when chatHistory changes
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);
  
  const handleChange = (e) => {
    setMessage(e.target.value);
  };
  
  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedFriend || sending) return;
    
    setSending(true);
    const messageToSend = message.trim();
    
    try {
      // FIRST: Create an optimistic update with a temporary message object
      const tempMessage = {
        sender: true,
        message_type: 'TEXT',
        message: messageToSend,
        time_stamp: new Date().toISOString()
      };
      
      // Use the chatHistoryRef to access the current chat history
      const currentChatHistory = chatHistoryRef.current || {};
      const pageNumbers = Object.keys(currentChatHistory).map(Number);
      const latestPageNumber = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
      
      // Optimistically add message to UI
      console.log('Adding optimistic message update:', tempMessage);
      dispatch(addMessage({
        pageNumber: latestPageNumber,
        message: tempMessage
      }));
      
      // Clear input immediately for better UX
      setMessage('');
      
      // SECOND: Actually send the message to the server
      console.log('Sending message to server:', messageToSend);
      const response = await sendTextMessage(messageToSend);
      console.log('Server response:', response);
      
      if (response.result) {
        // Load the messages using loadPreviousChatHistory API
        try {
          console.log('Message sent successfully, loading updated messages...');
          
          // First load using the suggested API
          const historyResponse = await loadPreviousChatHistory();
          
          if (historyResponse.result && historyResponse.chat_history) {
            console.log('Successfully loaded messages after sending:', historyResponse.chat_history);
            dispatch(setChatHistory(historyResponse.chat_history));
          } else {
            console.error('Failed to load messages after sending:', historyResponse.message);
            
            // Fallback to the server response if available
            if (response.chat_history) {
              console.log('Using response.chat_history as fallback:', response.chat_history);
              dispatch(setChatHistory(response.chat_history));
            }
          }
          
          // Load more messages using the API directly
          console.log('Scheduling follow-up message loads');
          
          // Schedule follow-up message loads
          setTimeout(async () => {
            try {
              const followupResponse = await loadPreviousChatHistory();
              if (followupResponse.result && followupResponse.chat_history) {
                dispatch(setChatHistory(followupResponse.chat_history));
              }
            } catch (error) {
              console.error('Error in follow-up load:', error);
            }
          }, 1000);
        } catch (error) {
          console.error('Error loading messages after sending:', error);
          
          // Fallback to the server response if available
          if (response.chat_history) {
            dispatch(setChatHistory(response.chat_history));
          }
        }
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error notification
      dispatch(showNotification({
        message: error.message || 'Failed to send message',
        type: 'error'
      }));
      
      // Restore message to input if it failed
      setMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Box p={2} sx={{ 
      width: '100%', 
      backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper, 
      boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
    }}>
      <Stack direction='row' alignItems='center' spacing={3}>
        <Stack sx={{ width: '100%' }}> 
          {/* Emoji Picker */}
          <Box sx={{ 
            display: openPicker ? 'inline' : 'none', 
            zIndex: 10, 
            position: 'fixed', 
            bottom: 81, 
            right: 100 
          }}>
            <Picker 
              theme={theme.palette.mode} 
              data={data} 
              onEmojiSelect={(emoji) => {
                handleEmojiSelect(emoji);
                setOpenPicker(false);
              }}
            />
          </Box> 
          
          {/* Message Input */}
          <MessageInput 
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onSend={handleSendMessage}
            setOpenPicker={setOpenPicker}
            inputRef={inputRef}
          />
        </Stack>
        
        {/* Send Button */}
        <Box sx={{
          height: 48, 
          width: 48, 
          backgroundColor: theme.palette.primary.main, 
          borderRadius: 1.5
        }}>
          <Stack sx={{
            height: '100%', 
            width: '100%', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <IconButton 
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
            >
              {sending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <PaperPlaneTilt color='#fff' />
              )}
            </IconButton>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default Footer;