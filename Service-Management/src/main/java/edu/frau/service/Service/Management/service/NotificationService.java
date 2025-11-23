package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.model.User;

import java.util.List;

public interface NotificationService {

    Notification sendToUser(User user, String message);

    Notification sendToUsername(String username, String message);

    Notification sendToRole(Role role, String message);

    List<Notification> getNotificationsForUser(String username);

    List<Notification> getNotificationsForRole(String roleName);

    List<Notification> getLatestAdminNotifications();

    boolean markAsRead(Long id);

    default void logAdminAction(String message) {
        sendToUsername("admin", message);
    }
}
