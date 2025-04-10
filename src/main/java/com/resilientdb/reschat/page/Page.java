package com.resilientdb.reschat.page;


import com.resilientdb.reschat.exceptions.Exceptions;
import com.resilientdb.reschat.message.Message;

import java.util.ArrayList;
import java.util.List;

public class Page {
    private List<Message> page;

    Page() {
        this.page = new ArrayList<Message>();
    }

    public void addMessage(Message message) throws Exceptions.tooManyMessagesException {
        if (this.page.size() >= 20) {
            throw new Exceptions.tooManyMessagesException();
        }

        this.page.add(message);
    }
}
