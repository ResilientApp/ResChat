package com.resilientdb.reschat.page;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resilientdb.reschat.exceptions.Exceptions;
import com.resilientdb.reschat.message.Message;

import java.util.ArrayList;
import java.util.List;

public class Page {
    public List<Message> page;

    public Page() {
        this.page = new ArrayList<Message>();
    }

    public Page(String pageString) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        Page parsed = mapper.readValue(pageString, Page.class);
        this.page = parsed.page;
    }

    public String toJsonString() throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(this);
    }

    public void addMessage(Message message) throws Exceptions.tooManyMessagesException {
        if (this.page.size() >= 20) {
            throw new Exceptions.tooManyMessagesException();
        }

        this.page.add(message);
    }


}
