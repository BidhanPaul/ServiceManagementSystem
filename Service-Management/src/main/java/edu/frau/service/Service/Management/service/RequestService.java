package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceOrder;
import edu.frau.service.Service.Management.model.ServiceRequest;

import java.util.List;
import java.util.Optional;

public interface RequestService {
    ServiceRequest createRequest(ServiceRequest request);

    Optional<ServiceRequest> getRequestById(Long id);

    List<ServiceRequest> getAllRequests();

    Optional<ServiceRequest> updateRequest(Long id, ServiceRequest updated);

    boolean deleteRequest(Long id);

    boolean adminDeleteRequest(Long id);


    ServiceRequest submitForReview(Long id, String username);

    ServiceRequest approveForBidding(Long id, String approverUsername);

    ServiceRequest reject(Long id, String approverUsername, String reason);

    ServiceOffer addOffer(Long requestId, ServiceOffer offer);

    List<ServiceOffer> getOffersForRequest(Long requestId);

    ServiceRequest selectPreferredOffer(Long requestId, Long offerId, String decidedBy);

    ServiceOrder createServiceOrderFromOffer(Long offerId, String decidedBy);

    // ✅ NEW
    ServiceRequest reactivateBidding(Long requestId);

    void pullProviderOffers(Long requestId);

    ServiceOrder finalApproveAndCreateOrder(Long offerId);


}
