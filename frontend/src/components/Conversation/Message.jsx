import { Box, Stack } from '@mui/material';
import React from 'react';
import { Chat_History } from '../../data';
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg, TimeLine } from './MsgTypes';

const Message = ({ menu }) => {
  return (
    <Box p={3}>
      <Stack spacing={3}>
        {Chat_History.map((el, index) => {
          const key = el.id ? el.id : index;
          switch (el.type) {
            case 'divider':
              return <TimeLine key={key} el={el} />;
            case 'msg':
              switch (el.subtype) {
                case 'img':
                  return <MediaMsg key={key} el={el} menu={menu} />;
                case 'doc':
                  return <DocMsg key={key} el={el} menu={menu} />;
                case 'link':
                  return <LinkMsg key={key} el={el} menu={menu} />;
                case 'reply':
                  return <ReplyMsg key={key} el={el} menu={menu} />;
                default:
                  return <TextMsg key={key} el={el} menu={menu} />;
              }
            default:
              return null;
          }
        })}
      </Stack>
    </Box>
  );
};

export default Message;