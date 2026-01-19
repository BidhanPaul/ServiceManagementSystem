package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.ServiceOrderFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceOrderFeedbackRepository extends JpaRepository<ServiceOrderFeedback, Long> {
    Optional<ServiceOrderFeedback> findByServiceOrderId(Long orderId);
    boolean existsByServiceOrderId(Long orderId);
}
