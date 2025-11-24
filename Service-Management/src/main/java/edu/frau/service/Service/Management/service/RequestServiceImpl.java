package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.*;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import edu.frau.service.Service.Management.repository.ServiceOrderRepository;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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

    // ---------- helpers ----------

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("No authenticated user");
        }
        return auth.getName();
    }

    private User getCurrentUser() {
        String username = getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    // ---------- CRUD + workflow ----------

    @Override
    public ServiceRequest createRequest(ServiceRequest request) {
        User current = getCurrentUser();
        if (current.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Only PROJECT_MANAGER can create service requests");
        }

        // store creator
        request.setRequestedByUsername(current.getUsername());

        // default status
        if (request.getStatus() == null) {
            request.setStatus(RequestStatus.DRAFT);
        }

        // sane defaults for offers
        if (request.getMaxOffers() == null) {
            request.setMaxOffers(1);
        }
        if (request.getMaxAcceptedOffers() == null) {
            request.setMaxAcceptedOffers(1);
        }

        ServiceRequest saved = requestRepository.save(request);

        notificationService.sendToRole(
                Role.PROCUREMENT_OFFICER,
                "New draft service request created: " + saved.getTitle()
        );

        return saved;
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
            if (existing.getStatus() != RequestStatus.DRAFT) {
                throw new RuntimeException("Only DRAFT requests can be edited");
            }

            existing.setTitle(updated.getTitle());
            existing.setType(updated.getType());
            existing.setProjectId(updated.getProjectId());
            existing.setProjectName(updated.getProjectName());
            existing.setContractId(updated.getContractId());
            existing.setContractSupplier(updated.getContractSupplier());
            existing.setStartDate(updated.getStartDate());
            existing.setEndDate(updated.getEndDate());
            existing.setPerformanceLocation(updated.getPerformanceLocation());
            existing.setMaxOffers(updated.getMaxOffers());
            existing.setMaxAcceptedOffers(updated.getMaxAcceptedOffers());
            existing.setRequiredLanguages(updated.getRequiredLanguages());
            existing.setMustHaveCriteria(updated.getMustHaveCriteria());
            existing.setNiceToHaveCriteria(updated.getNiceToHaveCriteria());
            existing.setTaskDescription(updated.getTaskDescription());
            existing.setFurtherInformation(updated.getFurtherInformation());
            existing.setRoles(updated.getRoles());

            return requestRepository.save(existing);
        });
    }

    @Override
    public boolean deleteRequest(Long id) {
        Optional<ServiceRequest> opt = requestRepository.findById(id);
        if (opt.isEmpty()) return false;

        ServiceRequest req = opt.get();
        if (req.getStatus() != RequestStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT requests can be deleted");
        }
        requestRepository.deleteById(id);
        return true;
    }

    @Override
    public ServiceRequest submitForReview(Long id, String username) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        req.setStatus(RequestStatus.IN_REVIEW);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToRole(
                Role.PROCUREMENT_OFFICER,
                "Service request in review: " + saved.getTitle()
        );

        return saved;
    }

    @Override
    public ServiceRequest approveForBidding(Long id, String approverUsername) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        req.setStatus(RequestStatus.APPROVED_FOR_BIDDING);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Your request has been approved for bidding: " + req.getTitle()
        );
        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Request approved for bidding: " + req.getTitle()
        );

        return saved;
    }

    @Override
    public ServiceRequest reject(Long id, String approverUsername, String reason) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        req.setStatus(RequestStatus.REJECTED);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Request rejected: " + req.getTitle() + " – " + reason
        );

        return saved;
    }

    @Override
    public ServiceOffer addOffer(Long requestId, ServiceOffer offer) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        offer.setServiceRequest(request);

        ServiceOffer saved = offerRepository.save(offer);

        if (request.getStatus() == RequestStatus.APPROVED_FOR_BIDDING) {
            request.setStatus(RequestStatus.BIDDING);
            requestRepository.save(request);
        }

        notificationService.sendToUsername(
                request.getRequestedByUsername(),
                "New offer received for request: " + request.getTitle()
        );
        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "New offer received for request: " + request.getTitle()
        );

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

        req.setPreferredOfferId(offer.getId());
        req.setStatus(RequestStatus.EVALUATION);
        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Preferred offer selected for request: " + req.getTitle()
        );
        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Preferred offer selected for request: " + req.getTitle()
        );

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
        order.setLocation(req.getPerformanceLocation());
        order.setSupplierName(offer.getSupplierName());
        order.setSupplierRepresentative(offer.getSupplierRepresentative());
        order.setSpecialistName(offer.getSpecialistName());

        // role = first requested role name, if any
        String roleName = null;
        if (req.getRoles() != null && !req.getRoles().isEmpty()) {
            roleName = req.getRoles().get(0).getRoleName();
        }
        order.setRole(roleName);

        // total man days = sum of all roles
        int totalManDays = 0;
        if (req.getRoles() != null) {
            totalManDays = req.getRoles().stream()
                    .map(r -> r.getManDays() != null ? r.getManDays() : 0)
                    .reduce(0, Integer::sum);
        }
        order.setManDays(totalManDays);

        order.setContractValue(offer.getTotalCost());

        ServiceOrder savedOrder = orderRepository.save(order);

        req.setStatus(RequestStatus.ORDERED);
        requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Service order created for request: " + req.getTitle()
        );

        return savedOrder;
    }
}
