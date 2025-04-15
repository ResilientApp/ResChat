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

  const [loadedPages, setLoadedPages] = useState(new Set());
  const scrollHeightRef = useRef(0);
  const scrollPositionRef = useRef(0);

  const handleScroll = async (e) => {
    const { scrollTop } = e.target;

    if (scrollTop < 100 && !loadingMore && !allLoaded) {
      setLoadingMore(true);

      try {
        console.log('Loading previous messages (scroll triggered)');
        const response = await loadPreviousChatHistory();

        if (response && response.result) {
          if (response.chat_history && Object.keys(response.chat_history).length > 0) {
            dispatch(updateChatHistory(response.chat_history));

            const newPageNumbers = Object.keys(response.chat_history).map(Number);
            const newLoaded = new Set(loadedPages);
            newPageNumbers.forEach(page => newLoaded.add(page));
            setLoadedPages(newLoaded);

            if (newPageNumbers.includes(1)) {
              setAllLoaded(true);
            }

            scrollHeightRef.current = messagesContainerRef.current.scrollHeight;
            scrollPositionRef.current = messagesContainerRef.current.scrollTop;

          } else {
            console.log('No more previous messages found.');
            setAllLoaded(true);
          }
        } else {
          console.warn('Failed to load previous messages:', response?.message);
        }
      } catch (error) {
        console.error('Error in scroll-triggered message loading:', error);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  const loadOlderMessages = async () => {
    if (isLoadingUpdates || loadingMore || allLoaded) return;

    setIsLoadingUpdates(true);
    scrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
    scrollPositionRef.current = messagesContainerRef.current?.scrollTop || 0;

    try {
      console.log('Loading older chat messages using loadPreviousChatHistory API...');
      const response = await loadPreviousChatHistory();

      if (response && response.result) {
        console.log('Successfully loaded older messages:', response.chat_history);
        if (response.chat_history && Object.keys(response.chat_history).length > 0) {
          const newPageNumbers = Object.keys(response.chat_history).map(Number);
          const currentLoadedPages = new Set(loadedPages);
          const actuallyNewPages = newPageNumbers.filter(page => !currentLoadedPages.has(page));

          if (actuallyNewPages.length > 0) {
            console.log('New older pages found:', actuallyNewPages);
            dispatch(updateChatHistory(response.chat_history));

            const newLoadedPages = new Set(loadedPages);
            actuallyNewPages.forEach(page => newLoadedPages.add(page));
            setLoadedPages(newLoadedPages);

            if (newLoadedPages.has(1)) {
              console.log('Reached the beginning of the conversation.');
              setAllLoaded(true);
            }
          } else {
            console.log('loadPreviousChatHistory returned already loaded pages or empty.');
            if (Object.keys(response.chat_history).length === 0) {
              setAllLoaded(true);
            }
          }
        } else {
          console.log('No more older messages found.');
          setAllLoaded(true);
        }
      } else {
        console.warn('Failed to load older messages or server returned error.');
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
      lastMessageCountRef.current = 0;

      try {
        const response = await initialLoadChatHistory();
        if (response.result && response.chat_history) {
          console.log('Initial chat history loaded:', response.chat_history);
          dispatch(setChatHistory(response.chat_history));

          const initialPageNumbers = Object.keys(response.chat_history).map(Number);
          setLoadedPages(new Set(initialPageNumbers));

          if (initialPageNumbers.includes(1)) {
            console.log('Initial load included page 1, marking allLoaded.');
            setAllLoaded(true);
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
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          lastMessageCountRef.current = messageCount;
        }, 100);
      }
    }
  }, [selectedFriend]);

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
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = scrollPositionRef.current + heightDifference;
          }
        }, 0);
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
          }
        }}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Loading earlier messages...
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
            transition: 'opacity 0.3s'
          }}>
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