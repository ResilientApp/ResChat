package com.resilientdb.reschat.page;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;
import java.time.*;

public class Message {
    private final String senderUsername;
    private final Timestamp utcTimeStamp;
    private final boolean textMessage;
    private final String message;
    private final String encryptedAesKeySender;
    private final String encryptedAesKeyReceiver;

    public Message(String senderUsername,
                   LocalDateTime localTime,
                   String userTimeZone,
                   boolean textMessage,
                   String message,
                   String encryptedAesKeySender,
                   String encryptedAesKeyReceiver) {

        this.senderUsername = senderUsername;
        this.utcTimeStamp = convertToUtc(localTime, userTimeZone);
        this.textMessage = textMessage;
        this.message = message; // If this is a file, it should be a JSON string
        this.encryptedAesKeySender = encryptedAesKeySender;
        this.encryptedAesKeyReceiver = encryptedAesKeyReceiver;
    }

    @JsonCreator
    public Message(
            @JsonProperty("senderUsername") String senderUsername,
            @JsonProperty("utcTimeStamp") Timestamp utcTimeStamp,
            @JsonProperty("textMessage") boolean textMessage,
            @JsonProperty("message") String message,
            @JsonProperty("encryptedAesKeySender") String encryptedAesKeySender,
            @JsonProperty("encryptedAesKeyReceiver") String encryptedAesKeyReceiver) {
        this.senderUsername = senderUsername;
        this.utcTimeStamp = utcTimeStamp;
        this.textMessage = textMessage;
        this.message = message;
        this.encryptedAesKeySender = encryptedAesKeySender;
        this.encryptedAesKeyReceiver = encryptedAesKeyReceiver;
    }



    private Timestamp convertToUtc(LocalDateTime localDateTime, String userTimeZone) {
        ZonedDateTime zonedDateTime = localDateTime.atZone(ZoneId.of(userTimeZone));
        Instant utcInstant = zonedDateTime.withZoneSameInstant(ZoneOffset.UTC).toInstant();
        return Timestamp.from(utcInstant);
    }


    public String getSenderUsername() {
        return senderUsername;
    }

    public Timestamp getUtcTimeStamp() {
        return utcTimeStamp;
    }

    public boolean isTextMessage() {
        return textMessage;
    }

    public String getMessage() {
        return message;
    }

    public String getEncryptedAesKeySender() {
        return encryptedAesKeySender;
    }

    public String getEncryptedAesKeyReceiver() {
        return encryptedAesKeyReceiver;
    }
}
