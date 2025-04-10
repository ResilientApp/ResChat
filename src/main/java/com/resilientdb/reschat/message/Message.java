package com.resilientdb.reschat.message;

import java.sql.Timestamp;

public record Message(
        String senderUsername,
        Timestamp timeStamp,
        boolean isText,
        String message,
        String encryptedAesKeySender,
        String encryptedAesKeyReceiver
) {
}
