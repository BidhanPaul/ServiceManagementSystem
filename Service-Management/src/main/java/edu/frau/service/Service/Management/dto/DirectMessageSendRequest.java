package edu.frau.service.Service.Management.dto;

import edu.frau.service.Service.Management.model.Role;

public class DirectMessageSendRequest {

    private String threadKey;
    private String requestId;

    private String senderUsername;
    private Role senderRole;

    private String recipientUsername;
    private Role recipientRole;

    private String message;

    public DirectMessageSendRequest() {}

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
}
