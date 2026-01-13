package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.*;

import java.util.List;

public interface NotificationService {

    // SYSTEM notifications
    Notification sendToUser(User user, String message);
    Notification sendToUsername(String username, String message);
    Notification sendToRole(Role role, String message);

    // ✅ DIRECT MESSAGE
    Notification sendDirectMessage(
            String threadKey,
            String requestId,
            String senderUsername,
            Role senderRole,
            String recipientUsername,
            Role recipientRole,
            String message
    );

    List<Notification> getNotificationsForUser(String username);

    // ✅ optional category filter
    List<Notification> getNotificationsForUser(String username, NotificationCategory category);

    List<Notification> getNotificationsForRole(String roleName);

    List<Notification> getLatestAdminNotifications();

    boolean markAsRead(Long id);

    // ✅ badge
    long getUnreadCount(String username);

    // ✅ FIXED: no hardcode username
    default void logAdminAction(String message) {
        sendToRole(Role.ADMIN, message);
    }
}
