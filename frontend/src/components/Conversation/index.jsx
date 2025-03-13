import { Box, Stack, CircularProgress, Typography } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { updateChatHistory, setChatHistory, showNotification } from '../../redux/slices/app.jsx';
import { updateChatHistory as fetchChatUpdates, loadPreviousChatHistory } from '../../services/chat';

const Conversation = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { chatHistory, selectedFriend } = useSelector((state) => state.app);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  
  // Handle scrolling to load more messages
  const handleScroll = async (e) => {
    const { scrollTop } = e.target;
    
    // If we're near the top of the scroll container and not already loading more messages
    if (scrollTop < 100 && !loadingMore && !allLoaded) {
      setLoadingMore(true);
      
      try {
        const response = await loadPreviousChatHistory();
        
        if (response.result) {
          if (Object.keys(response.chat_history).length > 0) {
            dispatch(updateChatHistory(response.chat_history));
          } else {
            setAllLoaded(true);
          }
        } else {
          dispatch(showNotification({
            message: response.message || 'Failed to load more messages',
            type: 'error'
          }));
        }
      } catch (error) {
        console.error('Error loading previous messages:', error);
        dispatch(showNotification({
          message: 'Failed to load previous messages',
          type: 'error'
        }));
      } finally {
        setLoadingMore(false);
      }
    }
  };
  
  // Set up polling for chat updates
  // We're now handling this in the main useEffect and the GeneralApp component

  // Loading state for previous messages
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  
  // Function to load messages using loadPreviousChatHistory
  const loadMessages = async () => {
    if (isLoadingPrevious) return;
    
    try {
      setIsLoadingPrevious(true);
      console.log('Loading chat messages using loadPreviousChatHistory API...');
      
      const response = await loadPreviousChatHistory();
      
      if (response.result) {
        console.log('Successfully loaded messages:', response.chat_history);
        if (response.chat_history) {
          dispatch(setChatHistory(response.chat_history));
        }
      } else {
        console.error('Failed to load messages:', response.message);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingPrevious(false);
    }
  };
  
  // No need to expose this globally anymore
  
  // Load messages when a friend is selected
  useEffect(() => {
    if (selectedFriend) {
      console.log('Friend selected, loading messages...');
      loadMessages();
    }
  }, [selectedFriend]);
  
  // Set up periodic loading of messages
  useEffect(() => {
    let intervalId;
    
    if (selectedFriend) {
      // Poll at a reasonable interval
      intervalId = setInterval(() => {
        loadMessages();
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedFriend]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Log the raw chat history
  console.log('Raw chat history:', chatHistory);
  
  // Format chat history into a flat array for rendering
  // Use a try/catch to handle any unexpected issues
  let messages = [];
  try {
    messages = Object.entries(chatHistory || {})
      // Make sure we sort pages numerically (not as strings)
      .sort(([pageNumA], [pageNumB]) => parseInt(pageNumA) - parseInt(pageNumB))
      // Extract messages from each page and flatten into single array
      .flatMap(([pageNum, msgs]) => {
        console.log(`Page ${pageNum} messages:`, msgs);
        // Handle null, undefined, or non-array values safely
        if (!msgs || !Array.isArray(msgs)) {
          console.warn(`Page ${pageNum} has invalid messages format:`, msgs);
          return [];
        }
        return msgs.filter(msg => msg != null); // Extra safety filter
      });
  } catch (error) {
    console.error('Error processing chat history:', error);
    messages = [];
  }
  
  console.log('Processed messages for rendering:', messages, 'Total count:', messages.length);

  return (
    <Stack height={'100%'} maxHeight={'100vh'} width={'auto'}>
      {/* Chat header */}
      <Header />
      
      {/* Messages container */}
      <Box 
        className='scrollbar' 
        width={"100%"} 
        sx={{
          flexGrow: 1, 
          height: '100%', 
          overflowY: 'scroll',
          '&::-webkit-scrollbar': {
            width: '0.4em'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'light' ? '#bdbdbd' : '#666'
          }
        }}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {/* Loading indicator for previous messages */}
        {loadingMore && (
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {/* All loaded indicator */}
        {allLoaded && (
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <Typography variant="caption" color="text.secondary">
              No more messages
            </Typography>
          </Box>
        )}
        
        {/* Render messages */}
        {messages.length > 0 ? (
          <Message messages={messages} />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              No messages yet. Send a message to start the conversation!
            </Typography>
          </Box>
        )}
        
        {/* Invisible element to allow scrolling to the most recent messages */}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Chat input footer */}
      <Footer />
    </Stack>
  )
}

export default Conversation;