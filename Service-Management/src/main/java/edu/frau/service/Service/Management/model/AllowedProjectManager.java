package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "allowed_project_managers",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"email"}),
                @UniqueConstraint(columnNames = {"username"})
        }
)
public class AllowedProjectManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // optional username in whitelist (if your XML has it)
    @Column(length = 100)
    private String username;

    @Column(nullable = false, length = 200)
    private String email;

    @Column(length = 200)
    private String fullName;

    private Instant importedAt = Instant.now();

    public AllowedProjectManager() {}

    public AllowedProjectManager(String username, String email, String fullName) {
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.importedAt = Instant.now();
    }

    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Instant getImportedAt() { return importedAt; }
    public void setImportedAt(Instant importedAt) { this.importedAt = importedAt; }
}
