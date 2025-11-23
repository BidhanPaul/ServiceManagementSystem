package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.*;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import edu.frau.service.Service.Management.repository.ServiceOrderRepository;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class RequestServiceImpl implements RequestService {

    @Autowired
    private ServiceRequestRepository requestRepository;

    @Autowired
    private ServiceOfferRepository offerRepository;

    @Autowired
    private ServiceOrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Override
    public ServiceRequest createRequest(ServiceRequest request) {

        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        request.setRequestedByUsername(user);

        if (request.getStatus() == null)
            request.setStatus(RequestStatus.DRAFT);

        switch (request.getType()) {
            case SINGLE:
                request.setMaxOffers(1);
                request.setMaxAcceptedOffers(1);
                break;

            case MULTI:
                if (request.getMaxOffers() == null)
                    throw new IllegalArgumentException("Max offers must be provided for MULTI request");
                if (request.getMaxAcceptedOffers() == null)
                    request.setMaxAcceptedOffers(request.getMaxOffers());
                break;

            case TEAM:
                // Later when adding team logic
                break;
        }

        return requestRepository.save(request);
    }



    @Override
    public Optional<ServiceRequest> getRequestById(Long id) {
        return requestRepository.findById(id);
    }

    @Override
    public List<ServiceRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    @Override
    public Optional<ServiceRequest> updateRequest(Long id, ServiceRequest updated) {
        return requestRepository.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setType(updated.getType());
            existing.setProjectReference(updated.getProjectReference());
            existing.setContractReferences(updated.getContractReferences());
            existing.setStartDate(updated.getStartDate());
            existing.setEndDate(updated.getEndDate());
            existing.setTaskDescription(updated.getTaskDescription());
            existing.setDomain(updated.getDomain());
            existing.setRoleName(updated.getRoleName());
            existing.setTechnology(updated.getTechnology());
            existing.setExperienceLevel(updated.getExperienceLevel());
            existing.setPerformanceLocation(updated.getPerformanceLocation());
            existing.setSumOfManDays(updated.getSumOfManDays());
            existing.setOnsiteDays(updated.getOnsiteDays());
            // keep status as is unless you want to allow changes
            return requestRepository.save(existing);
        });
    }

    @Override
    public boolean deleteRequest(Long id) {
        if (!requestRepository.existsById(id)) return false;
        requestRepository.deleteById(id);
        return true;
    }

    @Override
    public ServiceRequest submitForReview(Long id, String username) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        req.setStatus(RequestStatus.IN_REVIEW);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToRole(Role.PROCUREMENT_OFFICER,
                "Service request in review: " + saved.getTitle());

        return saved;
    }

    @Override
    public ServiceRequest approveForBidding(Long id, String approverUsername) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        req.setStatus(RequestStatus.APPROVED_FOR_BIDDING);
        ServiceRequest saved = requestRepository.save(req);

        // notify project manager & resource planner
        notificationService.sendToUsername(req.getRequestedByUsername(),
                "Your request has been approved for bidding: " + req.getTitle());
        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "Request approved for bidding: " + req.getTitle());

        return saved;
    }

    @Override
    public ServiceRequest reject(Long id, String approverUsername, String reason) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        req.setStatus(RequestStatus.REJECTED);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToUsername(req.getRequestedByUsername(),
                "Request rejected: " + req.getTitle() + " – " + reason);

        return saved;
    }

    @Override
    public ServiceOffer addOffer(Long requestId, ServiceOffer offer) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        offer.setServiceRequest(request);

        ServiceOffer saved = offerRepository.save(offer);

        // put request into bidding / evaluation phase if needed
        if (request.getStatus() == RequestStatus.APPROVED_FOR_BIDDING) {
            request.setStatus(RequestStatus.BIDDING);
            requestRepository.save(request);
        }

        // notify PM + resource planner
        notificationService.sendToUsername(request.getRequestedByUsername(),
                "New offer received for request: " + request.getTitle());
        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "New offer received for request: " + request.getTitle());

        return saved;
    }

    @Override
    public List<ServiceOffer> getOffersForRequest(Long requestId) {
        return offerRepository.findByServiceRequestId(requestId);
    }

    @Override
    public ServiceRequest selectPreferredOffer(Long requestId, Long offerId, String decidedBy) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        req.setPreferredOfferId(offer.getId()); // make sure this field exists in ServiceRequest
        req.setStatus(RequestStatus.EVALUATION);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToUsername(req.getRequestedByUsername(),
                "Preferred offer selected for request: " + req.getTitle());
        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "Preferred offer selected for request: " + req.getTitle());

        return saved;
    }

    @Override
    public ServiceOrder createServiceOrderFromOffer(Long offerId, String decidedBy) {
        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        ServiceRequest req = offer.getServiceRequest();

        ServiceOrder order = new ServiceOrder();
        order.setTitle(req.getTitle());
        order.setServiceRequestReference(req);
        order.setStartDate(req.getStartDate());
        order.setEndDate(req.getEndDate());
        order.setLocation(req.getDomain()); // or correct field
        order.setSupplierName(offer.getSupplierName());
        order.setSupplierRepresentative(offer.getSupplierRepresentative());
        order.setSpecialistName(offer.getSpecialistName());
        order.setRole(req.getRole());
        order.setManDays(req.getSumOfManDays());
        order.setContractValue(offer.getTotalCost());

        ServiceOrder savedOrder = orderRepository.save(order);

        req.setStatus(RequestStatus.ORDERED);
        requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedBy().getUsername(),
                "Service order created for request: " + req.getTitle()
        );

        return savedOrder;
    }

}
