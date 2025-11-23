// src/main/java/edu/frau/service/Service/Management/controller/NotificationController.java
package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.Notification;
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

    // GET /api/notifications/admin  → last 20 notifications for ADMIN
    @GetMapping("/admin")
    public ResponseEntity<List<Notification>> getAdminNotifications() {
        List<Notification> list = notificationService.getLatestAdminNotifications();
        return ResponseEntity.ok(list);
    }

    // POST /api/notifications/{id}/read
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        boolean updated = notificationService.markAsRead(id);
        return updated ? ResponseEntity.ok("Marked as read") :
                ResponseEntity.notFound().build();
    }

}
