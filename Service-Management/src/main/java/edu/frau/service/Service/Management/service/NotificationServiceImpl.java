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
        // ✅ Save ONE real message only (no fake sender copy)
        Notification n = new Notification();
        n.setCategory(NotificationCategory.DIRECT_MESSAGE);

        n.setThreadKey(threadKey);
        n.setRequestId(requestId);

        n.setSenderUsername(senderUsername);
        n.setSenderRole(senderRole);

        n.setRecipientUsername(recipientUsername);
        n.setRecipientRole(recipientRole);

        n.setMessage(message);
        n.setSentAt(Instant.now());
        n.setRead(false); // read status belongs to recipient

        return notificationRepository.save(n);
    }

    // ---------------- GETTERS ----------------

    @Override
    public List<Notification> getNotificationsForUser(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return List.of();

        List<Notification> feed = notificationRepository.findUserFeed(username, user.getRole());

        /**
         * ✅ IMPORTANT FIX:
         * Outgoing DMs (senderUsername == current user) should NOT behave like unread notifications for the sender.
         * Otherwise:
         *  - Sidebar badge counts outgoing as unread
         *  - "Mark as read" on recipient side changes sender view too
         *
         * So we force outgoing DM rows to be returned as read=true for the sender (response-only).
         */
        for (Notification n : feed) {
            if (n.getCategory() == NotificationCategory.DIRECT_MESSAGE
                    && username != null
                    && username.equals(n.getSenderUsername())
                    && (n.getRecipientUsername() == null || !username.equals(n.getRecipientUsername()))) {
                n.setRead(true); // response-only (not saving)
            }
        }

        return feed;
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
