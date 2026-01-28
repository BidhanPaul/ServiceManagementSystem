package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "service_order_feedback")
public class ServiceOrderFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ One feedback per order (simple enterprise baseline)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_order_id", unique = true)
    private ServiceOrder serviceOrder;

    private int rating; // 1..5

    @Column(length = 2000)
    private String comment;

    private Instant createdAt;
    private String createdBy; // PM usernamea

    public ServiceOrderFeedback() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ServiceOrder getServiceOrder() { return serviceOrder; }
    public void setServiceOrder(ServiceOrder serviceOrder) { this.serviceOrder = serviceOrder; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
