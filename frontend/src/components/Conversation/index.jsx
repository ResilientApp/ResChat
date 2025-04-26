import { Box, Stack, CircularProgress, Typography } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import { updateChatHistory, setChatHistory, showNotification } from '../../redux/slices/app.jsx';
import { 
  updateChatHistory as fetchChatUpdates, 
  loadPreviousChatHistory, 
  initialLoadChatHistory,
  loadSpecificPage 
} from '../../services/chat';

const Conversation = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { chatHistory, selectedFriend } = useSelector((state) => state.app);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // Track loaded pages and current page tracking
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [currentMinPage, setCurrentMinPage] = useState(null);
  const scrollHeightRef = useRef(0);
  const scrollPositionRef = useRef(0);

  // Function to load a specific previous page
  const loadPreviousPage = async () => {
    if (!currentMinPage || currentMinPage <= 1 || loadingMore || allLoaded) {
      return;
    }
    
    const targetPage = currentMinPage - 1;
    console.log(`Attempting to load previous page: ${targetPage}`);
    
    setLoadingMore(true);
    
    // Store current scroll position for later adjustment
    scrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
    scrollPositionRef.current = messagesContainerRef.current?.scrollTop || 0;
    
    try {
      const response = await loadSpecificPage(targetPage);
      
      if (response && response.result) {
        if (response.chat_history && Object.keys(response.chat_history).length > 0) {
          console.log(`Successfully loaded page ${targetPage}`);
          
          // Update chat history with the new page
          dispatch(updateChatHistory(response.chat_history));
          
          // Update loaded pages
          const newLoaded = new Set(loadedPages);
          newLoaded.add(targetPage);
          setLoadedPages(newLoaded);
          
          // Update our tracking of the minimum page loaded
          setCurrentMinPage(targetPage);
          
          // If we've reached page 1, mark all as loaded
          if (targetPage === 1) {
            console.log('Reached page 1, marking all messages as loaded');
            setAllLoaded(true);
          }
        } else {
          // If the response was successful but no page was returned, we've reached the end
          console.log(`No page ${targetPage} found, marking all as loaded`);
          setAllLoaded(true);
        }
      } else {
        console.warn(`Failed to load page ${targetPage}:`, response?.message);
      }
    } catch (error) {
      console.error(`Error loading page ${targetPage}:`, error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = async (e) => {
    const { scrollTop } = e.target;

    // When user scrolls to top, load the previous page
    if (scrollTop < 50 && !loadingMore && !allLoaded && currentMinPage > 1) {
      console.log('User scrolled to top, loading previous page');
      loadPreviousPage();
    }
  };

  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  // Modified to use our page number tracking approach
  const loadOlderMessages = async () => {
    // Check if we can load previous pages
    if (isLoadingUpdates || loadingMore || allLoaded || !currentMinPage || currentMinPage <= 1) {
      console.log('Skipping loadOlderMessages - already loading, all loaded, or at beginning');
      return;
    }

    // Mark that we're loading to prevent duplicate calls
    setIsLoadingUpdates(true);
    
    // Store current scroll position for later adjustment
    scrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
    scrollPositionRef.current = messagesContainerRef.current?.scrollTop || 0;

    try {
      // Calculate the page to load - immediately previous to our current min page
      const targetPage = currentMinPage - 1;
      console.log(`Loading older chat page ${targetPage} using loadSpecificPage API...`);
      
      const response = await loadSpecificPage(targetPage);

      if (response && response.result) {
        console.log(`loadSpecificPage response for page ${targetPage}:`, response);
        if (response.chat_history && Object.keys(response.chat_history).length > 0) {
          const newPageNumbers = Object.keys(response.chat_history).map(Number);
          console.log('Received pages:', newPageNumbers);
          
          // Update Redux store with the new pages
          dispatch(updateChatHistory(response.chat_history));

          // Track which pages we've now loaded
          const newLoadedPages = new Set(loadedPages);
          newPageNumbers.forEach(page => newLoadedPages.add(page));
          setLoadedPages(newLoadedPages);

          // Update our minimum page tracker
          if (newPageNumbers.includes(targetPage)) {
            setCurrentMinPage(targetPage);
          }

          // Check if we've reached the beginning of the conversation
          if (targetPage === 1 || newPageNumbers.includes(1)) {
            console.log('Reached the beginning of the conversation (page 1).');
            setAllLoaded(true);
          } else {
            // We still have more pages to load - continue recursively
            console.log(`More pages may be available before page ${targetPage}`);
            
            // Continue loading more pages until we reach page 1
            setTimeout(() => {
              if (!allLoaded) {
                console.log('Continuing to load older messages automatically');
                loadOlderMessages();
              }
            }, 300);
          }
        } else {
          console.log('No more older messages found, marking all loaded.');
          setAllLoaded(true);
        }
      } else {
        console.warn(`Failed to load page ${targetPage}:`, response?.message);
        // Don't set allLoaded=true here, as it might be a temporary error
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  useEffect(() => {
    const loadInitialChat = async () => {
      if (!selectedFriend) return;

      console.log(`Loading initial chat for ${selectedFriend}`);
      dispatch(setChatHistory({}));
      setLoadedPages(new Set());
      setAllLoaded(false);
      setCurrentMinPage(null);
      lastMessageCountRef.current = 0;

      try {
        const response = await initialLoadChatHistory();
        if (response.result && response.chat_history) {
          console.log('Initial chat history loaded:', response.chat_history);
          dispatch(setChatHistory(response.chat_history));

          const initialPageNumbers = Object.keys(response.chat_history).map(Number);
          initialPageNumbers.sort((a, b) => a - b); // Sort in ascending order
          
          if (initialPageNumbers.length > 0) {
            const newLoadedPages = new Set(initialPageNumbers);
            setLoadedPages(newLoadedPages);
            
            // Set the minimum page we've loaded
            const minPage = Math.min(...initialPageNumbers);
            console.log(`Setting minimum loaded page to ${minPage}`);
            setCurrentMinPage(minPage);
            
            // If we've loaded page 1, mark all as loaded
            if (minPage === 1) {
              console.log('Initial load included page 1, marking allLoaded.');
              setAllLoaded(true);
            } else {
              console.log(`Initial load lowest page is ${minPage}, more pages are available.`);
              
              // Automatically load page minPage-1 after initial render
              setTimeout(() => {
                if (!allLoaded && minPage > 1) {
                  console.log(`Automatically loading page ${minPage-1}...`);
                  loadPreviousPage();
                }
              }, 1000);
            }
          } else {
            console.log('No pages loaded initially.');
          }
        } else {
          throw new Error(response.message || 'Failed to load initial chat history');
        }
      } catch (error) {
        console.error('Error loading initial chat:', error);
        dispatch(showNotification({
          message: `Failed to load chat: ${error.message}`,
          type: 'error'
        }));
      }
    };

    loadInitialChat();

    return () => {
      console.log(`Cleaning up conversation for ${selectedFriend}`);
    };
  }, [selectedFriend, dispatch]);

  const errorCountRef = useRef(0);
  const maxErrorsAllowed = 5;
  const pollingIntervalRef = useRef(null);
  const currentPollingInterval = useRef(3000);

  useEffect(() => {
    const pollForUpdates = async () => {
      if (!selectedFriend || isLoadingUpdates || loadingMore) {
        return;
      }

      let isNearBottom = true;
      if (messagesContainerRef.current) {
        isNearBottom = messagesContainerRef.current.scrollHeight -
                       messagesContainerRef.current.scrollTop -
                       messagesContainerRef.current.clientHeight < 200;
      }

      if (!isNearBottom) {
        return;
      }

      setIsLoadingUpdates(true);

      try {
        console.log('Polling for new messages...');
        const response = await fetchChatUpdates();

        if (response && response.result && response.chat_history) {
          if (Object.keys(response.chat_history).length > 0) {
            console.log('New message data received:', response.chat_history);
            dispatch(updateChatHistory(response.chat_history));

            const newPageNumbers = Object.keys(response.chat_history).map(Number);
            const newLoaded = new Set(loadedPages);
            newPageNumbers.forEach(page => newLoaded.add(page));
            setLoadedPages(newLoaded);
          }

          errorCountRef.current = 0;
          if (currentPollingInterval.current > 3000) {
            console.log('Resetting polling interval to 3000ms');
            currentPollingInterval.current = 3000;
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(pollForUpdates, currentPollingInterval.current);
          }
        } else {
          console.warn('Polling request failed or returned no result:', response?.message);
          errorCountRef.current++;
        }
      } catch (error) {
        console.error('Error during polling:', error);
        errorCountRef.current++;
      } finally {
        setIsLoadingUpdates(false);

        if (errorCountRef.current >= maxErrorsAllowed) {
          const nextInterval = Math.min(currentPollingInterval.current * 2, 30000);
          if (nextInterval > currentPollingInterval.current) {
            console.warn(`Polling errors reached ${errorCountRef.current}. Increasing interval to ${nextInterval}ms.`);
            currentPollingInterval.current = nextInterval;
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(pollForUpdates, currentPollingInterval.current);
          }
        }
      }
    };

    if (selectedFriend) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      console.log(`Starting polling interval (${currentPollingInterval.current}ms) for ${selectedFriend}`);
      pollingIntervalRef.current = setInterval(pollForUpdates, currentPollingInterval.current);
    }

    return () => {
      if (pollingIntervalRef.current) {
        console.log(`Clearing polling interval for ${selectedFriend}`);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      currentPollingInterval.current = 3000;
      errorCountRef.current = 0;
    };
  }, [selectedFriend, dispatch, loadedPages, isLoadingUpdates, loadingMore]);

  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (messagesEndRef.current && selectedFriend) {
        const messageCount = Object.values(chatHistory || {}).flat().length;
        if (messageCount > 0) {
            console.log('Scrolling to bottom initially for', selectedFriend);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                lastMessageCountRef.current = messageCount;
            }, 100);
        }
    }
  }, [selectedFriend, chatHistory]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const allMessages = Object.values(chatHistory || {}).flat();
    const messageCount = allMessages.length;

    if (loadingMore && scrollHeightRef.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const heightDifference = newScrollHeight - scrollHeightRef.current;

      if (heightDifference > 0) {
        console.log('Adjusting scroll position after loading older messages',
          { prevScrollTop: scrollPositionRef.current, diff: heightDifference });
        
        // Use a more reliable way to maintain scroll position
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = scrollPositionRef.current + heightDifference;
            
            // Double-check the position and adjust if needed
            setTimeout(() => {
              // If we're extremely close to the top, nudge it down slightly
              // to prevent immediate re-triggering of the scroll event
              if (messagesContainerRef.current.scrollTop < 5) {
                messagesContainerRef.current.scrollTop = 5;
              }
            }, 50);
          }
        }, 10);
      }
      scrollHeightRef.current = 0;
      scrollPositionRef.current = 0;

    } else if (messageCount > lastMessageCountRef.current && !loadingMore) {
      const isNearBottom = messagesContainerRef.current.scrollHeight -
                          messagesContainerRef.current.scrollTop -
                          messagesContainerRef.current.clientHeight < 250;

      if (isNearBottom && messagesEndRef.current) {
        console.log('Scrolling smoothly to bottom for new messages');
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        console.log('New messages arrived, but user was scrolled up. Not scrolling automatically.');
      }
    }

    lastMessageCountRef.current = messageCount;
  }, [chatHistory, loadingMore]);

  let messages = [];
  try {
    messages = Object.entries(chatHistory || {})
      .sort(([pageNumA], [pageNumB]) => parseInt(pageNumA) - parseInt(pageNumB))
      .flatMap(([pageNum, msgs]) => {
        if (!msgs || !Array.isArray(msgs)) {
          console.warn(`Page ${pageNum} has invalid messages format:`, msgs);
          return [];
        }
        return msgs.filter(msg => msg != null);
      })
      .sort((a, b) => new Date(a.time_stamp) - new Date(b.time_stamp));
  } catch (error) {
    console.error('Error processing chat history for rendering:', error);
    messages = [];
    dispatch(showNotification({ message: 'Error displaying messages', type: 'error' }));
  }

  return (
    <Stack height={'100%'} maxHeight={'100vh'} width={'auto'}>
      <Header />

      <Box
        className='scrollbar'
        width={"100%"}
        sx={{
          flexGrow: 1,
          height: 'calc(100% - 128px)',
          overflowY: 'scroll',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'light' ? '#bdbdbd' : '#555',
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#a0a0a0' : '#777'
          },
          // Add special styling for when at top to make it clear to users
          // that they can load more messages
          '&::-webkit-scrollbar-button:start:decrement': {
            display: !allLoaded ? 'block' : 'none',
            height: !allLoaded ? '8px' : '0',
            backgroundColor: !allLoaded ? theme.palette.primary.main : 'transparent',
            opacity: 0.7
          }
        }}
        ref={messagesContainerRef}
        onScroll={handleScroll}
        // Add onScrollCapture to ensure we don't miss scroll events
        onScrollCapture={(e) => {
          // Double-check for scroll at top as a backup
          if (e.target.scrollTop === 0 && !loadingMore && !allLoaded) {
            console.log('Scroll reached absolute top, triggering load');
            loadOlderMessages();
          }
        }}
      >
        {loadingMore && (
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Loading page {currentMinPage ? currentMinPage - 1 : '...'}
            </Typography>
          </Box>
        )}

        {allLoaded && !loadingMore && messages.length > 0 && (
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Beginning of conversation
            </Typography>
          </Box>
        )}

        {!allLoaded && !loadingMore && messages.length > 0 && (
          <Box sx={{
            textAlign: 'center',
            padding: 1,
            opacity: 0.7,
            transition: 'opacity 0.3s',
            cursor: 'pointer',
            bgcolor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: 1,
            margin: '4px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            '&:hover': {
              opacity: 1,
              bgcolor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            }
          }}
          onClick={() => loadPreviousPage()}
          >
            <Typography variant="caption" color="primary" sx={{ fontWeight: 'medium' }}>
              {currentMinPage > 1 ? `Load previous messages (Page ${currentMinPage-1})` : 'Load more messages'}
            </Typography>
            {currentMinPage && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                Currently viewing from page {currentMinPage} {currentMinPage > 1 ? '(scroll up for more)' : ''}
              </Typography>
            )}
          </Box>
        )}

        {messages.length > 0 ? (
          <Message messages={messages} />
        ) : (
          !isLoadingUpdates && !loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                No messages yet. Send one to start!
              </Typography>
            </Box>
          )
        )}

        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </Box>

      <Footer />
    </Stack>
  )
}

export default Conversation;