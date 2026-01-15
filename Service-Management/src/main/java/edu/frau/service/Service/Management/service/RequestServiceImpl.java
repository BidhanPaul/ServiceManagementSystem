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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

    private void ensureBiddingFields(ServiceRequest req) {
        // ✅ allow 0 (demo); default only when null
        if (req.getBiddingCycleDays() == null) {
            req.setBiddingCycleDays(7);
        }
        // if negative, fix to default
        if (req.getBiddingCycleDays() != null && req.getBiddingCycleDays() < 0) {
            req.setBiddingCycleDays(7);
        }

        if (req.getBiddingActive() == null) {
            req.setBiddingActive(false);
        }
    }


    private Instant nowInstant() {
        return Instant.now();
    }

    // ---------- CRUD + workflow ----------

    @Override
    public ServiceRequest createRequest(ServiceRequest request) {
        User current = getCurrentUser();
        if (current.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Only PROJECT_MANAGER can create service requests");
        }

        request.setRequestedByUsername(current.getUsername());
        request.setRequestedByRole(current.getRole().name());

        if (request.getStatus() == null) {
            request.setStatus(RequestStatus.DRAFT);
        }

        if (request.getMaxOffers() == null) request.setMaxOffers(1);
        if (request.getMaxAcceptedOffers() == null) request.setMaxAcceptedOffers(1);

        if (request.getRequiredLanguages() == null) request.setRequiredLanguages(List.of());
        if (request.getMustHaveCriteria() == null) request.setMustHaveCriteria(List.of());
        if (request.getNiceToHaveCriteria() == null) request.setNiceToHaveCriteria(List.of());
        if (request.getRoles() == null) request.setRoles(List.of());

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
                throw new IllegalStateException("Only DRAFT requests can be edited");
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

            if (updated.getBiddingCycleDays() != null && updated.getBiddingCycleDays() > 0) {
                existing.setBiddingCycleDays(updated.getBiddingCycleDays());
            }

            return requestRepository.save(existing);
        });
    }

    @Override
    public boolean deleteRequest(Long id) {
        Optional<ServiceRequest> opt = requestRepository.findById(id);
        if (opt.isEmpty()) return false;

        ServiceRequest req = opt.get();
        if (req.getStatus() != RequestStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT requests can be deleted");
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

        // ✅ THIS WAS MISSING
        notificationService.sendToRole(
                Role.PROCUREMENT_OFFICER,
                "Request submitted for review: " + saved.getTitle()
        );

        return saved;
    }


    @Override
    public ServiceRequest approveForBidding(Long id, String approverUsername) {
        ServiceRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        ensureBiddingFields(req);

        Instant now = Instant.now();
        req.setBiddingStartAt(now);

        // ✅ 0 = demo => 3 seconds
        if (req.getBiddingCycleDays() != null && req.getBiddingCycleDays() == 0) {
            req.setBiddingEndAt(now.plusSeconds(3));
        } else {
            int days = req.getBiddingCycleDays() != null ? req.getBiddingCycleDays() : 7;
            req.setBiddingEndAt(now.plusSeconds(days * 24L * 60L * 60L));
        }

        req.setBiddingActive(true);
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
        req.setBiddingActive(false);

        ServiceRequest saved = requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Request rejected: " + req.getTitle() + " – " + reason
        );

        return saved;
    }

    // ✅ PM can reactivate bidding after expiry
    @Override
    public ServiceRequest reactivateBidding(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        // only owner PM should reactivate (optional but recommended)
        // If you don't want auth logic here, remove this block.
        User current = getCurrentUser();
        if (current.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Only PROJECT_MANAGER can reactivate bidding");
        }
        if (!current.getUsername().equals(req.getRequestedByUsername())) {
            throw new RuntimeException("You can only reactivate your own requests");
        }

        // already active? return
        if (req.getBiddingActive() != null && req.getBiddingActive()) {
            return req;
        }

        // ✅ IMPORTANT: if it was a demo request saved with 0 days, give it a real cycle on reactivation
        // Choose ONE default:
        int DEFAULT_REACTIVATION_DAYS = 7; // change to 3 if you want shorter reactivation window

        if (req.getBiddingCycleDays() == null || req.getBiddingCycleDays() <= 0) {
            req.setBiddingCycleDays(DEFAULT_REACTIVATION_DAYS);
        }

        ensureBiddingFields(req);

        Instant now = nowInstant();
        req.setBiddingStartAt(now);
        req.setBiddingEndAt(now.plus(req.getBiddingCycleDays(), ChronoUnit.DAYS));
        req.setBiddingActive(true);

        req.setStatus(RequestStatus.APPROVED_FOR_BIDDING);

        ServiceRequest saved = requestRepository.save(req);

        // optional notification
        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Bidding reactivated for request: " + req.getTitle()
        );

        return saved;
    }

    @Override
    public ServiceOffer addOffer(Long requestId, ServiceOffer offer) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        ensureBiddingFields(request);

        if (request.getBiddingActive() == null || !request.getBiddingActive()) {
            throw new IllegalStateException("Bidding is not active for this request.");
        }

        // ✅ FIX: Instant comparison
        if (request.getBiddingEndAt() != null && Instant.now().isAfter(request.getBiddingEndAt())) {
            request.setBiddingActive(false);
            request.setStatus(RequestStatus.EXPIRED);
            requestRepository.save(request);
            throw new IllegalStateException("Bidding window expired.");
        }

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
        req.setBiddingActive(false);

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
    public boolean adminDeleteRequest(Long id) {
        ServiceRequest req = requestRepository.findById(id).orElse(null);
        if (req == null) return false;

        // ✅ delete children first (avoid FK constraint errors)
        try {
            offerRepository.deleteByServiceRequestId(id);
        } catch (Exception ignored) {}

        try {
            orderRepository.deleteByServiceRequestId(id);
        } catch (Exception ignored) {}

        // ✅ now delete the request itself
        requestRepository.deleteById(id);

        // optional admin log / notification
        notificationService.sendToUsername("admin", "ADMIN deleted service request: " + req.getTitle() + " (#" + id + ")");

        return true;
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

        String roleName = null;
        if (req.getRoles() != null && !req.getRoles().isEmpty()) {
            roleName = req.getRoles().get(0).getRoleName();
        }
        order.setRole(roleName);

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
        req.setBiddingActive(false);
        requestRepository.save(req);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Service order created for request: " + req.getTitle()
        );

        return savedOrder;
    }
}
