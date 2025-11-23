package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceOrder;
import edu.frau.service.Service.Management.model.ServiceRequest;

import java.util.List;
import java.util.Optional;

public interface RequestService {

    // basic CRUD you already had
    ServiceRequest createRequest(ServiceRequest request);
    Optional<ServiceRequest> getRequestById(Long id);
    List<ServiceRequest> getAllRequests();
    Optional<ServiceRequest> updateRequest(Long id, ServiceRequest request);
    boolean deleteRequest(Long id);

    // workflow
    ServiceRequest submitForReview(Long id, String username);
    ServiceRequest approveForBidding(Long id, String approverUsername);
    ServiceRequest reject(Long id, String approverUsername, String reason);

    // offers
    ServiceOffer addOffer(Long requestId, ServiceOffer offer);
    List<ServiceOffer> getOffersForRequest(Long requestId);
    ServiceRequest selectPreferredOffer(Long requestId, Long offerId, String decidedBy);

    // order
    ServiceOrder createServiceOrderFromOffer(Long offerId, String decidedBy);
}
