import { Box, Stack, CircularProgress, Typography } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { updateChatHistory, setChatHistory, showNotification } from '../../redux/slices/app.jsx';
import { updateChatHistory as fetchChatUpdates, loadPreviousChatHistory, initialLoadChatHistory } from '../../services/chat';

const Conversation = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { chatHistory, selectedFriend } = useSelector((state) => state.app);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  
  // Keep track of the number of pages we've loaded
  const [loadedPages, setLoadedPages] = useState(new Set());
  
  // Keep track of previous scroll height to maintain position
  const scrollHeightRef = useRef(0);
  const scrollPositionRef = useRef(0);
  
  // Handle scrolling to load more messages
  const handleScroll = async (e) => {
    const { scrollTop } = e.target;
    
    // If we're near the top of the scroll container and not already loading more messages
    if (scrollTop < 100 && !loadingMore && !allLoaded) {
      setLoadingMore(true);
      
      try {
        console.log('Loading previous messages (scroll triggered)');
        // Use our improved loadMessages function with the scroll flag
        await loadMessages(true);
      } catch (error) {
        console.error('Error in scroll-triggered message loading:', error);
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
  const loadMessages = async (isScrollTriggered = false) => {
    // Function is used both for scheduled updates and scroll-triggered loading
    // We use isScrollTriggered to distinguish between these cases
    
    if (isLoadingPrevious) return;
    
    try {
      setIsLoadingPrevious(true);
      
      // Save scroll positions if this is a scroll-triggered load
      if (isScrollTriggered && messagesContainerRef.current) {
        scrollHeightRef.current = messagesContainerRef.current.scrollHeight;
        scrollPositionRef.current = messagesContainerRef.current.scrollTop;
      }
      
      console.log('Loading chat messages using loadPreviousChatHistory API...');
      
      const response = await loadPreviousChatHistory();
      
      if (response && response.result) {
        console.log('Successfully loaded messages:', response.chat_history);
        if (response.chat_history && Object.keys(response.chat_history).length > 0) {
          // Extract the new pages from the response
          const newPageNumbers = Object.keys(response.chat_history).map(Number);
          console.log('Response contains pages:', newPageNumbers);
          
          // Check which pages are new
          const currentLoadedPages = new Set(loadedPages);
          const actuallyNewPages = newPageNumbers.filter(page => !currentLoadedPages.has(page));
          
          if (actuallyNewPages.length > 0) {
            console.log('New pages found:', actuallyNewPages);
            
            // Create a merged chat history to avoid losing any messages
            const mergedChatHistory = { ...chatHistory };
            
            // Add new pages from the response
            Object.entries(response.chat_history).forEach(([pageNum, messages]) => {
              const pageNumber = Number(pageNum);
              if (!mergedChatHistory[pageNumber] || mergedChatHistory[pageNumber].length === 0) {
                mergedChatHistory[pageNumber] = messages;
              }
            });
            
            // Update Redux with the merged history
            dispatch(setChatHistory(mergedChatHistory));
            
            // Update our set of loaded pages
            const newLoadedPages = new Set(loadedPages);
            actuallyNewPages.forEach(page => newLoadedPages.add(page));
            setLoadedPages(newLoadedPages);
            
            // Reset allLoaded flag since we found new pages
            setAllLoaded(false);
          } else if (isScrollTriggered) {
            // If we're scrolling up but didn't find new pages, we might be at the beginning
            console.log('No new pages found during scroll-triggered load');
            setAllLoaded(true);
          }
        } else {
          console.log('No messages found in response');
          if (isScrollTriggered) {
            setAllLoaded(true);
          }
        }
      } else {
        // Handle failed response gracefully - don't show errors to user
        console.warn('Failed to load messages or server returned error.');
        
        // If we get an error from the server, we'll wait a bit longer
        // before trying again to avoid spamming the server
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fail silently to the user - just log the error
    } finally {
      setIsLoadingPrevious(false);
    }
  };
  
  // No need to expose this globally anymore
  
  // Load messages when a friend is selected
  useEffect(() => {
    if (selectedFriend) {
      console.log('Friend selected, initializing conversation view...');
      
      // Reset state for new friend selection
      setLoadedPages(new Set());
      setAllLoaded(false);
      
      // When a friend is selected, we already have initial messages
      // from the initialLoadChatHistory call in GeneralApp.
      
      // Let's analyze what pages we have and record them in loadedPages
      const pageNumbers = Object.keys(chatHistory || {}).map(Number);
      if (pageNumbers.length > 0) {
        console.log('Initial pages already loaded:', pageNumbers);
        setLoadedPages(new Set(pageNumbers));
        
        // Check if we need to set allLoaded based on page numbers
        // If page 1 is loaded, we're likely at the beginning
        if (pageNumbers.includes(1)) {
          console.log('Page 1 is already loaded, marking as allLoaded');
          setAllLoaded(true);
        }
      } else {
        // If we don't have any pages yet, try loading them
        console.log('No pages loaded yet, fetching initial messages');
        loadMessages(false);
      }
    }
  }, [selectedFriend, chatHistory]);

  // Load initial chat history when component mounts or friend changes
  useEffect(() => {
    const loadInitialChat = async () => {
      try {
        const response = await initialLoadChatHistory();
        if (response.result) {
          dispatch(setChatHistory(response.chat_history || {}));
        } else {
          throw new Error(response.message || 'Failed to load chat history');
        }
      } catch (error) {
        console.error('Error loading initial chat:', error);
        dispatch(showNotification({
          message: 'Failed to load chat history',
          type: 'error'
        }));
      }
    };

    if (selectedFriend) {
      loadInitialChat();
    }

    return () => {
      // Cleanup
      dispatch(setChatHistory({}));
    };
  }, [selectedFriend, dispatch]);
  
  // Track consecutive errors
  const errorCountRef = useRef(0);
  const maxErrorsAllowed = 3;
  const pollingIntervalRef = useRef(2000);
  
  // Set up periodic loading of messages with awareness of scrolling
  useEffect(() => {
    let intervalId;
    
    if (selectedFriend) {
      // Poll at a reasonable interval
      intervalId = setInterval(async () => {
        // Only auto-refresh if we're not scrolled up and not currently loading more
        if (messagesContainerRef.current) {
          const isNearBottom = messagesContainerRef.current.scrollHeight - 
                                messagesContainerRef.current.scrollTop - 
                                messagesContainerRef.current.clientHeight < 100;
          
          if (isNearBottom && !loadingMore && !isLoadingPrevious) {
            try {
              // Only load messages if we're scrolled to bottom
              // Pass false to indicate this is a periodic update, not scroll-triggered
              await loadMessages(false);
              
              // Reset error count on success
              errorCountRef.current = 0;
              // Reset polling interval after successful requests
              pollingIntervalRef.current = 2000;
            } catch (error) {
              // Increment error count
              errorCountRef.current++;
              console.warn(`Loading error (${errorCountRef.current}/${maxErrorsAllowed})`);
              
              // If we've had too many consecutive errors, slow down polling
              if (errorCountRef.current >= maxErrorsAllowed) {
                pollingIntervalRef.current = 5000; // Slow down to 5 seconds
                console.warn('Too many errors, slowing down polling');
              }
            }
          }
        }
      }, pollingIntervalRef.current);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedFriend, loadingMore, isLoadingPrevious]);

  // Keep track of the last message count to determine if new messages arrived
  const lastMessageCountRef = useRef(0);
  
  // Initial scroll to bottom when first messages load or friend changes
  useEffect(() => {
    if (messagesEndRef.current && selectedFriend && Object.keys(chatHistory || {}).length > 0) {
      // Scroll to the latest messages immediately
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        console.log('Initially scrolled to bottom for', selectedFriend);
      }, 100);
    }
  }, [selectedFriend, Object.keys(chatHistory || {}).length]);
  
  // Maintain scroll position when loading older messages but scroll to bottom when new messages come in
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    // Calculate total message count
    const allMessages = Object.values(chatHistory || {}).flat();
    const messageCount = allMessages.length;
    
    if (loadingMore && scrollHeightRef.current > 0) {
      // If we're loading previous messages (scrolling up),
      // maintain the relative scroll position
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const heightDifference = newScrollHeight - scrollHeightRef.current;
      
      if (heightDifference > 0) {
        console.log('Adjusting scroll position to maintain view', 
          { prev: scrollPositionRef.current, diff: heightDifference });
        messagesContainerRef.current.scrollTop = scrollPositionRef.current + heightDifference;
      }
    } else if (messageCount > lastMessageCountRef.current) {
      // If new messages arrived (regular update or sent message),
      // scroll to bottom only if we weren't scrolled up
      const isNearBottom = messagesContainerRef.current.scrollHeight - 
                          messagesContainerRef.current.scrollTop - 
                          messagesContainerRef.current.clientHeight < 100;
                          
      if (isNearBottom && messagesEndRef.current) {
        console.log('Scrolling to bottom for new messages');
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Update message count reference
    lastMessageCountRef.current = messageCount;
  }, [chatHistory, loadingMore]);

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
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Loading earlier messages...
            </Typography>
          </Box>
        )}
        
        {/* All loaded indicator */}
        {allLoaded ? (
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Beginning of conversation
            </Typography>
          </Box>
        ) : (
          // Show a subtle hint to scroll up for more messages if we have some pages
          // but aren't at the beginning yet
          <Box sx={{ 
            textAlign: 'center', 
            padding: 1,
            opacity: Object.keys(chatHistory || {}).length > 0 ? 0.7 : 0,
            transition: 'opacity 0.3s'
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Scroll up to load earlier messages
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