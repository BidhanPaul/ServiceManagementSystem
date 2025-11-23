package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.model.User;
import edu.frau.service.Service.Management.repository.NotificationRepository;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Notification sendToUser(User user, String message) {
        if (user == null) return null;
        Notification n = new Notification();
        n.setMessage(message);
        n.setRecipientUsername(user.getUsername());
        n.setRecipientRole(user.getRole());
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

    @Override
    public List<Notification> getNotificationsForUser(String username) {
        return notificationRepository.findAll()
                .stream()
                .filter(n -> username.equals(n.getRecipientUsername()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> getNotificationsForRole(String roleName) {
        return notificationRepository.findAll()
                .stream()
                .filter(n -> n.getRecipientRole() != null &&
                        roleName.equals(n.getRecipientRole().name()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> getLatestAdminNotifications() {
        return notificationRepository.findTop20ByOrderBySentAtDesc();
    }

    @Override
    public boolean markAsRead(Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }).orElse(false);
    }
}
