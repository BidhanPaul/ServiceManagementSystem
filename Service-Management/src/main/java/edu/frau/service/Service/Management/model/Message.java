package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One conversation thread key (same for both users)
    @Column(nullable = false)
    private String threadKey;

    // Which request is this discussion for (optional but useful)
    private String requestId;

    @Column(nullable = false)
    private String senderUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role senderRole;

    @Column(nullable = false)
    private String recipientUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role recipientRole;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private Instant sentAt = Instant.now();

    @Column(nullable = false)
    private boolean readByRecipient = false;

    public Message() {}

    // Getters / Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getThreadKey() { return threadKey; }
    public void setThreadKey(String threadKey) { this.threadKey = threadKey; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }

    public Role getSenderRole() { return senderRole; }
    public void setSenderRole(Role senderRole) { this.senderRole = senderRole; }

    public String getRecipientUsername() { return recipientUsername; }
    public void setRecipientUsername(String recipientUsername) { this.recipientUsername = recipientUsername; }

    public Role getRecipientRole() { return recipientRole; }
    public void setRecipientRole(Role recipientRole) { this.recipientRole = recipientRole; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }

    public boolean isReadByRecipient() { return readByRecipient; }
    public void setReadByRecipient(boolean readByRecipient) { this.readByRecipient = readByRecipient; }
}
