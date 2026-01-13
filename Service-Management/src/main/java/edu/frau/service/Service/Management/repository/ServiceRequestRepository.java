package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.RequestStatus;
import edu.frau.service.Service.Management.model.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByRequestedByUsername(String username);

    List<ServiceRequest> findByStatus(RequestStatus status);

    List<ServiceRequest> findByProjectId(String projectId);

    // ✅ used by scheduler to find active bidding requests
    List<ServiceRequest> findByBiddingActiveTrue();

    List<ServiceRequest> findByBiddingActiveTrueAndBiddingEndAtBefore(Instant now);


}
