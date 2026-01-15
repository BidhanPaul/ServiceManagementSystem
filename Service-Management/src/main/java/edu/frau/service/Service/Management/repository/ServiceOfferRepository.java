package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.ServiceOffer;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ServiceOfferRepository extends JpaRepository<ServiceOffer, Long> {
    List<ServiceOffer> findByServiceRequestId(Long serviceRequestId);

    // ✅ NEW: used by scheduler / expiry logic
    boolean existsByServiceRequestId(Long serviceRequestId);

    @Modifying
    @Transactional
    @Query("delete from ServiceOffer o where o.serviceRequest.id = :requestId")
    void deleteByServiceRequestId(Long requestId);
}
