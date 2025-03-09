import { Box, Stack, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';

const Message = ({ menu }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/initial_load_chat_history')
      .then(res => res.json())
      .then(data => {
         if (data.result) {
           let chats = data.chat_history;
           // If chat history is not an array, convert its values to a flat array
           if (!Array.isArray(chats)) {
             chats = Object.values(chats).flat();
           }
           setMessages(chats);
         }
      })
      .catch(err => console.error("Failed to fetch chat history", err));
  }, []);

  return (
    <Box p={3}>
      <Stack spacing={3}>
        {messages.map((msg, index) => (
          <Box 
            key={index} 
            sx={{ p: 1, border: '1px solid #ccc', borderRadius: 1 }}
          >
            <Typography variant="caption">
              {msg.time_stamp}
            </Typography>
            {msg.message_type === "TEXT" && (
              <Typography variant="body1">
                {msg.message}
              </Typography>
            )}
            {msg.message_type === "FILE" && (
              <Typography variant="body1">
                File: {msg.message.file_name} ({msg.message.file_size} bytes)
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default Message;