package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;

    private String recipientUsername;

    @Enumerated(EnumType.STRING)
    private Role recipientRole;

    private Instant sentAt;

    private boolean read;

    // Constructors
    public Notification() {}

    public Notification(String message, String recipientUsername, Role recipientRole, Instant sentAt, boolean read) {
        this.message = message;
        this.recipientUsername = recipientUsername;
        this.recipientRole = recipientRole;
        this.sentAt = sentAt;
        this.read = read;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRecipientUsername() { return recipientUsername; }
    public void setRecipientUsername(String recipientUsername) { this.recipientUsername = recipientUsername; }

    public Role getRecipientRole() { return recipientRole; }
    public void setRecipientRole(Role recipientRole) { this.recipientRole = recipientRole; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
}
