package com.resilientdb.reschat.exceptions;

public class Exceptions {
    public static class tooManyMessagesException extends Exception {
        public tooManyMessagesException() {
            super("This page has more than 20 messages");
        }
    }
}
