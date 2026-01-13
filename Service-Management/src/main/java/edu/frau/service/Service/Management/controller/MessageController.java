package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.SendMessageRequest;
import edu.frau.service.Service.Management.model.Message;
import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/send")
    public ResponseEntity<Message> send(@RequestBody SendMessageRequest req) {
        if (req.getThreadKey() == null || req.getThreadKey().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (req.getSenderUsername() == null || req.getRecipientUsername() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Message m = new Message();
        m.setThreadKey(req.getThreadKey());
        m.setRequestId(req.getRequestId());
        m.setSenderUsername(req.getSenderUsername());
        m.setSenderRole(Role.valueOf(req.getSenderRole()));
        m.setRecipientUsername(req.getRecipientUsername());
        m.setRecipientRole(Role.valueOf(req.getRecipientRole()));
        m.setMessage(req.getMessage().trim());
        m.setSentAt(Instant.now());
        m.setReadByRecipient(false);

        return ResponseEntity.ok(messageService.sendMessage(m));
    }

    @GetMapping("/thread/{threadKey}")
    public ResponseEntity<List<Message>> getThread(@PathVariable String threadKey) {
        return ResponseEntity.ok(messageService.getThread(threadKey));
    }

    @PostMapping("/thread/{threadKey}/read/{username}")
    public ResponseEntity<Void> markThreadRead(@PathVariable String threadKey, @PathVariable String username) {
        messageService.markThreadRead(threadKey, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread/{username}")
    public ResponseEntity<Long> unreadCount(@PathVariable String username) {
        return ResponseEntity.ok(messageService.getUnreadCount(username));
    }

    @GetMapping("/threads/{username}")
    public ResponseEntity<List<String>> getThreads(@PathVariable String username) {
        return ResponseEntity.ok(messageService.getThreadKeysForUser(username));
    }
}
