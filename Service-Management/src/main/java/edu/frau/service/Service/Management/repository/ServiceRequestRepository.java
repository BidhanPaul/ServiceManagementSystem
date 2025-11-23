package edu.frau.service.Service.Management.repository;

import java.util.List;

import edu.frau.service.Service.Management.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import edu.frau.service.Service.Management.model.ServiceRequest;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    // Find all requests created by a specific user
    List<ServiceRequest> findByRequestedBy_Username(String username);

    // Optional additional methods
    List<ServiceRequest> findByStatus(String status);
    List<ServiceRequest> findByProjectReferenceId(Long projectId);
    List<ServiceRequest> findByRole(Role role);
}
