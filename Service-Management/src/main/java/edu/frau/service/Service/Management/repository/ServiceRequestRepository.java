package edu.frau.service.Service.Management.repository;

import java.util.List;

import edu.frau.service.Service.Management.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import edu.frau.service.Service.Management.model.ServiceRequest;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    // Find all requests created by a specific user
    List<ServiceRequest> findByRequestedByUsername(String username);

    // Optional additional methods
    List<ServiceRequest> findByStatus(RequestStatus status);

    // If you ever need by project
    List<ServiceRequest> findByProjectId(String projectId);
}
