package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Message;
import edu.frau.service.Service.Management.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final NotificationService notificationService;

    public MessageServiceImpl(MessageRepository messageRepository,
                              NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.notificationService = notificationService;
    }

    @Override
    public Message sendMessage(Message msg) {
        Message saved = messageRepository.save(msg);

        // ALSO create a notification for recipient (so it appears in Notifications page)
        notificationService.sendToUsername(
                msg.getRecipientUsername(),
                "DM from " + msg.getSenderUsername() + " (Req " + (msg.getRequestId() != null ? msg.getRequestId() : "-") + "): " + msg.getMessage()
        );

        return saved;
    }

    @Override
    public List<Message> getThread(String threadKey) {
        return messageRepository.findByThreadKeyOrderBySentAtAsc(threadKey);
    }

    @Override
    public long getUnreadCount(String username) {
        return messageRepository.countByRecipientUsernameAndReadByRecipientFalse(username);
    }

    @Override
    public void markThreadRead(String threadKey, String username) {
        List<Message> msgs = messageRepository.findByThreadKeyOrderBySentAtAsc(threadKey);
        boolean changed = false;

        for (Message m : msgs) {
            if (username.equals(m.getRecipientUsername()) && !m.isReadByRecipient()) {
                m.setReadByRecipient(true);
                changed = true;
            }
        }
        if (changed) messageRepository.saveAll(msgs);
    }

    @Override
    public List<String> getThreadKeysForUser(String username) {
        List<Message> list = messageRepository
                .findBySenderUsernameOrRecipientUsernameOrderBySentAtDesc(username, username);

        // unique thread keys, newest first
        LinkedHashSet<String> keys = list.stream()
                .map(Message::getThreadKey)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return new ArrayList<>(keys);
    }
}
