package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.DirectMessageRequest;
import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.NotificationCategory;
import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ---------------- SYSTEM: SEND TO USER ----------------
    @PostMapping("/user/{username}")
    public ResponseEntity<Notification> sendToUser(
            @PathVariable String username,
            @RequestBody String message
    ) {
        Notification n = notificationService.sendToUsername(username, message);
        if (n == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(n);
    }

    // ---------------- SYSTEM: SEND TO ROLE ----------------
    @PostMapping("/role/{role}")
    public ResponseEntity<Notification> sendToRole(
            @PathVariable String role,
            @RequestBody String message
    ) {
        try {
            Role r = Role.valueOf(role.toUpperCase());
            Notification n = notificationService.sendToRole(r, message);
            return ResponseEntity.ok(n);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ NEW: DIRECT MESSAGE (Procurement ↔ PM)
    @PostMapping("/direct-message")
    public ResponseEntity<Notification> sendDirectMessage(@RequestBody DirectMessageRequest body) {
        try {
            Role senderRole = Role.valueOf(body.senderRole);
            Role recipientRole = Role.valueOf(body.recipientRole);

            Notification n = notificationService.sendDirectMessage(
                    body.threadKey,
                    body.requestId,
                    body.senderUsername,
                    senderRole,
                    body.recipientUsername,
                    recipientRole,
                    body.message
            );

            return ResponseEntity.ok(n);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ---------------- GET ADMIN ----------------
    @GetMapping("/admin")
    public ResponseEntity<List<Notification>> getAdminNotifications() {
        return ResponseEntity.ok(notificationService.getLatestAdminNotifications());
    }

    // ---------------- GET ROLE FEED ----------------
    @GetMapping("/{role}")
    public ResponseEntity<List<Notification>> getNotificationsByRole(@PathVariable String role) {
        try {
            return ResponseEntity.ok(notificationService.getNotificationsForRole(role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ USER FEED (optionally filter by category)
    @GetMapping("/user/{username}")
    public ResponseEntity<List<Notification>> getUserNotifications(
            @PathVariable String username,
            @RequestParam(name = "category", required = false) String category
    ) {
        if (category == null || category.isBlank()) {
            return ResponseEntity.ok(notificationService.getNotificationsForUser(username));
        }
        NotificationCategory c = NotificationCategory.valueOf(category);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(username, c));
    }

    // ✅ unread count for sidebar badge
    @GetMapping("/user/{username}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable String username) {
        return ResponseEntity.ok(notificationService.getUnreadCount(username));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        boolean ok = notificationService.markAsRead(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }


}
