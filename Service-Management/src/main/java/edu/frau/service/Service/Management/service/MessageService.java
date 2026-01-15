package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Message;

import java.util.List;

public interface MessageService {
    Message sendMessage(Message msg);

    List<Message> getThread(String threadKey);

    long getUnreadCount(String username);

    void markThreadRead(String threadKey, String username);

    List<String> getThreadKeysForUser(String username);
}
