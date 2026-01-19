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
import edu.frau.service.Service.Management.integration.provider.ProviderManagementClient;
import edu.frau.service.Service.Management.integration.provider.ProviderOfferDTO;
import java.util.stream.Collectors;
import java.time.Instant;
import edu.frau.service.Service.Management.model.OrderStatus;



import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

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

    @Autowired
    private ProviderManagementClient providerClient;


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
        if (req.getBiddingCycleDays() == null) {
            req.setBiddingCycleDays(7);
        }
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

    // ✅ NEW: Generate unique SR number like SR-8F3K1Z2A
    private String generateUniqueRequestNumber() {
        // few retries to avoid extremely rare collisions
        for (int i = 0; i < 20; i++) {
            String code = randomBase36(8);
            String sr = "SR-" + code;
            if (!requestRepository.existsByRequestNumber(sr)) {
                return sr;
            }
        }
        // fallback (very unlikely)
        return "SR-" + randomBase36(12);
    }

    private String randomBase36(int len) {
        // base36: 0-9A-Z
        String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        StringBuilder sb = new StringBuilder(len);
        ThreadLocalRandom r = ThreadLocalRandom.current();
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
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

        // ✅ SR number set once on creation (if not already provided)
        if (request.getRequestNumber() == null || request.getRequestNumber().isBlank()) {
            request.setRequestNumber(generateUniqueRequestNumber());
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

            // ✅ do NOT change requestNumber on update
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

    @Override
    public ServiceRequest reactivateBidding(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        User current = getCurrentUser();
        if (current.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Only PROJECT_MANAGER can reactivate bidding");
        }
        if (!current.getUsername().equals(req.getRequestedByUsername())) {
            throw new RuntimeException("You can only reactivate your own requests");
        }

        if (req.getBiddingActive() != null && req.getBiddingActive()) {
            return req;
        }

        int DEFAULT_REACTIVATION_DAYS = 7;

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

        try { offerRepository.deleteByServiceRequestId(id); } catch (Exception ignored) {}
        try { orderRepository.deleteByServiceRequestId(id); } catch (Exception ignored) {}

        requestRepository.deleteById(id);

        notificationService.sendToUsername("admin", "ADMIN deleted service request: " + req.getTitle() + " (#" + id + ")");

        return true;
    }

    @Override
    public void pullProviderOffers(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        ensureBiddingFields(req);

        // Must be eligible for bidding
        if (req.getBiddingActive() == null || !req.getBiddingActive()) {
            throw new IllegalStateException("Bidding is not active for this request.");
        }

        // If expired, stop bidding
        if (req.getBiddingEndAt() != null && Instant.now().isAfter(req.getBiddingEndAt())) {
            req.setBiddingActive(false);
            req.setStatus(RequestStatus.EXPIRED);
            requestRepository.save(req);
            throw new IllegalStateException("Bidding window expired.");
        }

        // Group-4 offer.requestId must match your requestNumber (SR-XXXX)
        String externalRequestId = req.getRequestNumber();

        List<ProviderOfferDTO> externalOffers = providerClient.fetchAllOffers();
        if (externalOffers == null || externalOffers.isEmpty()) return;

        List<ProviderOfferDTO> matches = externalOffers.stream()
                .filter(o -> o != null && externalRequestId != null && externalRequestId.equals(o.requestId))
                .collect(Collectors.toList());

        if (matches.isEmpty()) return;

        // Load existing offers once (for duplicate prevention)
        List<ServiceOffer> existing = offerRepository.findByServiceRequestId(req.getId());

        int inserted = 0;
        for (ProviderOfferDTO ext : matches) {
            ServiceOffer offer = mapProviderOfferToServiceOffer(req, ext);

            boolean duplicate = existing.stream().anyMatch(e ->
                    safeEq(e.getSupplierName(), offer.getSupplierName())
                            && safeEq(e.getSpecialistName(), offer.getSpecialistName())
                            && Double.compare(e.getDailyRate(), offer.getDailyRate()) == 0
            );

            if (!duplicate) {
                offerRepository.save(offer);
                inserted++;
            }
        }

        // If first offers arrived, move into BIDDING
        if (inserted > 0 && req.getStatus() == RequestStatus.APPROVED_FOR_BIDDING) {
            req.setStatus(RequestStatus.BIDDING);
            requestRepository.save(req);
        }

        // Notify PM + RP that offers arrived (optional but looks professional)
        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Provider offers pulled for request: " + req.getTitle() + " (+" + inserted + ")"
        );
        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Provider offers pulled for request: " + req.getTitle() + " (+" + inserted + ")"
        );
    }

    private boolean safeEq(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.trim().equalsIgnoreCase(b.trim());
    }

    private ServiceOffer mapProviderOfferToServiceOffer(ServiceRequest req, ProviderOfferDTO ext) {
        ServiceOffer offer = new ServiceOffer();
        offer.setServiceRequest(req);

        // Supplier fields (your DB has these)
        offer.setSupplierName(ext.supplierName != null ? ext.supplierName : "Unknown Supplier");
        offer.setSupplierRepresentative("Provider Portal"); // can be overwritten later

        ProviderOfferDTO.Candidate c = null;
        Integer onsiteDays = 0;

        if (ext.response != null && ext.response.delivery != null && ext.response.delivery.proposedOnsiteDays != null) {
            onsiteDays = ext.response.delivery.proposedOnsiteDays;
        }

        if (ext.response != null && ext.response.staffing != null
                && ext.response.staffing.candidates != null && !ext.response.staffing.candidates.isEmpty()) {
            c = ext.response.staffing.candidates.get(0);
        }

        if (c != null) {
            // Your ServiceOffer model does not store specialistEmail, so we store name/id
            offer.setSpecialistName(c.specialistId != null ? c.specialistId : "Unknown Specialist");
            offer.setMaterialNumber(c.materialNumber);

            offer.setContractualRelationship(c.contractualRelationship);
            offer.setSubcontractorCompany(c.subcontractorCompany);

            double dailyRate = c.dailyRate != null ? c.dailyRate : 0.0;
            offer.setDailyRate(dailyRate);

            double travel = c.travelCostPerOnsiteDay != null ? c.travelCostPerOnsiteDay : 0.0;
            offer.setTravellingCost(travel * onsiteDays);
        } else {
            offer.setSpecialistName("Unknown Specialist");
            offer.setDailyRate(0.0);
            offer.setTravellingCost(0.0);
        }

        // Calculate man-days from your request roles (same logic you use for ServiceOrder)
        int totalManDays = 0;
        if (req.getRoles() != null) {
            totalManDays = req.getRoles().stream()
                    .map(r -> r.getManDays() != null ? r.getManDays() : 0)
                    .reduce(0, Integer::sum);
        }

        // Total cost (consistent & demo-ready)
        offer.setTotalCost(offer.getDailyRate() * totalManDays + offer.getTravellingCost());

        // Matching flags (you can refine later)
        offer.setMatchMustHaveCriteria(true);
        offer.setMatchNiceToHaveCriteria(true);
        offer.setMatchLanguageSkills(true);

        return offer;
    }


    @Override
    public ServiceOrder createServiceOrderFromOffer(Long offerId, String decidedBy) {
        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        ServiceRequest req = offer.getServiceRequest();

        ServiceOrder order = new ServiceOrder();
        order.setSelectedOffer(offer);
        order.setStatus(OrderStatus.PENDING_RP_APPROVAL);
        order.setCreatedAt(Instant.now());
        order.setCreatedBy(decidedBy);
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


        req.setStatus(RequestStatus.EVALUATION);
        req.setBiddingActive(false);
        requestRepository.save(req);


        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Service order created for request: " + req.getTitle()
        );

        return savedOrder;
    }
    @Override
    public ServiceOrder finalApproveAndCreateOrder(Long offerId) {
        User current = getCurrentUser();
        if (current.getRole() != Role.RESOURCE_PLANNER) {
            throw new RuntimeException("Only RESOURCE_PLANNER can final approve and create service order.");
        }

        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        ServiceRequest req = offer.getServiceRequest();

        // ✅ Must have a preferred offer selected first (PM step)
        if (req.getPreferredOfferId() == null) {
            throw new IllegalStateException("Preferred offer must be selected by PM before final approval.");
        }
        if (!req.getPreferredOfferId().equals(offer.getId())) {
            throw new IllegalStateException("Only the preferred offer can be final approved.");
        }

        // ✅ Only allow final approve in correct stages
        if (req.getStatus() != RequestStatus.EVALUATION && req.getStatus() != RequestStatus.BIDDING) {
            throw new IllegalStateException("Final approval allowed only in EVALUATION/BIDDING stage.");
        }

        ServiceOrder order = createServiceOrderFromOffer(offerId, current.getUsername());

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Resource Planner final approved and created order for: " + req.getTitle()
        );

        return order;
    }

}
