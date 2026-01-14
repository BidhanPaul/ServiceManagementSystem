package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.*;
import edu.frau.service.Service.Management.repository.NotificationRepository;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // ---------------- SYSTEM SENDERS ----------------

    @Override
    public Notification sendToUser(User user, String message) {
        if (user == null) return null;

        Notification n = new Notification();
        n.setMessage(message);
        n.setRecipientUsername(user.getUsername());
        n.setRecipientRole(user.getRole());
        n.setCategory(NotificationCategory.SYSTEM);
        n.setSentAt(Instant.now());
        n.setRead(false);

        return notificationRepository.save(n);
    }

    @Override
    public Notification sendToUsername(String username, String message) {
        User user = userRepository.findByUsername(username).orElse(null);
        return sendToUser(user, message);
    }

    @Override
    public Notification sendToRole(Role role, String message) {
        List<User> users = userRepository.findByRole(role);
        Notification last = null;
        for (User u : users) {
            last = sendToUser(u, message);
        }
        return last;
    }

    // ---------------- DIRECT MESSAGE ----------------

    @Override
    public Notification sendDirectMessage(
            String threadKey,
            String requestId,
            String senderUsername,
            Role senderRole,
            String recipientUsername,
            Role recipientRole,
            String message
    ) {
        // 1) Recipient copy
        Notification toRecipient = new Notification();
        toRecipient.setCategory(NotificationCategory.DIRECT_MESSAGE);

        toRecipient.setThreadKey(threadKey);
        toRecipient.setRequestId(requestId);

        toRecipient.setSenderUsername(senderUsername);
        toRecipient.setSenderRole(senderRole);

        toRecipient.setRecipientUsername(recipientUsername);
        toRecipient.setRecipientRole(recipientRole);

        toRecipient.setMessage(message);
        toRecipient.setSentAt(Instant.now());
        toRecipient.setRead(false);

        notificationRepository.save(toRecipient);

        // 2) Sender copy (so sender also sees it in their own DM thread)
        Notification toSender = new Notification();
        toSender.setCategory(NotificationCategory.DIRECT_MESSAGE);

        toSender.setThreadKey(threadKey);
        toSender.setRequestId(requestId);

        toSender.setSenderUsername(senderUsername);
        toSender.setSenderRole(senderRole);

        // ✅ store to sender inbox
        toSender.setRecipientUsername(senderUsername);
        toSender.setRecipientRole(senderRole);

        toSender.setMessage(message);
        toSender.setSentAt(Instant.now());
        toSender.setRead(true); // optional: sender copy can be auto-read

        notificationRepository.save(toSender);

        // return the recipient copy (or sender copy, doesn't matter)
        return toRecipient;
    }


    // ---------------- GETTERS ----------------

    @Override
    public List<Notification> getNotificationsForUser(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return List.of();

        return notificationRepository.findUserFeed(username, user.getRole());
    }


    @Override
    public List<Notification> getNotificationsForUser(String username, NotificationCategory category) {
        return notificationRepository.findByRecipientUsernameAndCategoryOrderBySentAtDesc(username, category);
    }


    @Override
    public List<Notification> getNotificationsForRole(String roleName) {
        Role role = Role.valueOf(roleName);
        return notificationRepository.findByRecipientRoleOrderBySentAtDesc(role);
    }

    @Override
    public List<Notification> getLatestAdminNotifications() {
        return notificationRepository.findTop20ByRecipientRoleOrderBySentAtDesc(Role.ADMIN);
    }

    // ---------------- MARK READ ----------------

    @Override
    public boolean markAsRead(Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }).orElse(false);
    }

    @Override
    public long getUnreadCount(String username) {
        return notificationRepository.countByRecipientUsernameAndReadFalse(username);
    }
}
