package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.dto.Group3OfferDecisionDTO;
import edu.frau.service.Service.Management.integration.provider.ProviderManagementClient;
import edu.frau.service.Service.Management.integration.provider.ProviderOfferDTO;
import edu.frau.service.Service.Management.model.*;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import edu.frau.service.Service.Management.repository.ServiceOrderRepository;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class RequestServiceImpl implements RequestService {

    private final ServiceRequestRepository requestRepository;
    private final ServiceOfferRepository offerRepository;
    private final ServiceOrderRepository orderRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // ✅ OPTIONAL now
    private final Optional<ProviderManagementClient> providerClient;

    // ✅ NEW: Used for autofill & Group-2 contract validation (external)
    private final ExternalReferenceService externalReferenceService;

    public RequestServiceImpl(
            ServiceRequestRepository requestRepository,
            ServiceOfferRepository offerRepository,
            ServiceOrderRepository orderRepository,
            NotificationService notificationService,
            UserRepository userRepository,

            // ✅ OPTIONAL now
            Optional<ProviderManagementClient> providerClient,

            ExternalReferenceService externalReferenceService
    ) {
        this.requestRepository = requestRepository;
        this.offerRepository = offerRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.providerClient = providerClient;
        this.externalReferenceService = externalReferenceService;
    }

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    private String extractContractSupplierSafe(Map<String, Object> contract) {
        if (contract == null) return null;

        // common flat keys
        String supplier =
                asString(contract.get("contractSupplier"));
        if (isBlank(supplier)) supplier = asString(contract.get("supplier"));
        if (isBlank(supplier)) supplier = asString(contract.get("supplierName"));

        // contract-team nested path: workflow.coordinator.selectedOffer.provider.name
        if (isBlank(supplier)) {
            try {
                Object rawObj = contract.get("raw");
                if (rawObj instanceof Map<?, ?> raw) {
                    contract = (Map<String, Object>) raw;
                }

                Object workflowObj = contract.get("workflow");
                if (workflowObj instanceof Map<?, ?> workflow) {
                    Object coordObj = ((Map<?, ?>) workflow).get("coordinator");
                    if (coordObj instanceof Map<?, ?> coord) {
                        Object offerObj = ((Map<?, ?>) coord).get("selectedOffer");
                        if (offerObj instanceof Map<?, ?> offer) {
                            Object providerObj = ((Map<?, ?>) offer).get("provider");
                            if (providerObj instanceof Map<?, ?> provider) {
                                supplier = asString(((Map<?, ?>) provider).get("name"));
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        return isBlank(supplier) ? null : supplier;
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("No authenticated user");
        }

        String name = auth.getName();
        if (name == null || name.isBlank() || "anonymousUser".equals(name)) {
            throw new RuntimeException("No authenticated user");
        }

        return name;
    }

    private User getCurrentUser() {
        String username = getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    // ✅ NEW: safe helpers for public endpoints
    private String getCurrentUsernameOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        String name = auth.getName();
        if (name == null || name.isBlank() || "anonymousUser".equals(name)) return null;

        return name;
    }

    private User getCurrentUserOrNull() {
        String username = getCurrentUsernameOrNull();
        if (username == null) return null;

        return userRepository.findByUsername(username).orElse(null);
    }

    private void ensureBiddingFields(ServiceRequest req) {
        if (req.getBiddingCycleDays() == null || req.getBiddingCycleDays() < 0) {
            req.setBiddingCycleDays(7);
        }
        if (req.getBiddingActive() == null) {
            req.setBiddingActive(false);
        }
    }

    private String generateUniqueRequestNumber() {
        for (int i = 0; i < 20; i++) {
            String sr = "SR-" + randomBase36(8);
            if (!requestRepository.existsByRequestNumber(sr)) {
                return sr;
            }
        }
        return "SR-" + randomBase36(12);
    }

    private String randomBase36(int len) {
        String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        StringBuilder sb = new StringBuilder(len);
        ThreadLocalRandom r = ThreadLocalRandom.current();
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private LocalDate parseLocalDateSafe(Object v) {
        if (v == null) return null;
        try {
            // expected: "2026-01-24" or similar ISO format
            return LocalDate.parse(String.valueOf(v));
        } catch (Exception ignored) {
            return null;
        }
    }

    private void requirePmOwner(ServiceRequest req) {
        User current = getCurrentUser();

        if (current.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Forbidden: only PROJECT_MANAGER");
        }

        if (req.getRequestedByUsername() == null ||
                !current.getUsername().equals(req.getRequestedByUsername())) {
            throw new RuntimeException("Forbidden: not your request");
        }
    }

    /**
     * ✅ NEW helper:
     * Group3 sends provider offer id in URL. Map it -> internal ServiceOffer.
     * Does NOT change any business logic, only resolves correct entity.
     */
    private ServiceOffer getInternalOfferByProviderOfferIdOrThrow(Long providerOfferId) {
        return offerRepository.findByProviderOfferId(providerOfferId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found for providerOfferId: " + providerOfferId));
    }

    /**
     * ✅ NEW: Autofill request fields from selected project (and contract if needed)
     * - Does NOT overwrite user-entered values (only fills missing/blank ones)
     */
    private void autofillFromExternalProject(ServiceRequest request) {
        if (request == null) return;

        // ---------- PROJECT ----------
        if (!isBlank(request.getProjectId())) {

            // ✅ Use NORMALIZED project (handles projectStart/projectEnd/selectedLocations/roles)
            Map<String, Object> norm = externalReferenceService.getProjectNormalized(request.getProjectId());
            if (norm != null) {

                // projectName
                if (isBlank(request.getProjectName())) {
                    String name = asString(norm.get("projectName"));
                    if (!isBlank(name)) request.setProjectName(name);
                }

                // title (ONLY fill if missing)
                if (isBlank(request.getTitle())) {
                    String title = asString(norm.get("title"));
                    if (!isBlank(title)) request.setTitle(title);
                }

                // start/end
                if (request.getStartDate() == null) {
                    LocalDate d = parseLocalDateSafe(norm.get("startDate"));
                    if (d != null) request.setStartDate(d);
                }

                if (request.getEndDate() == null) {
                    LocalDate d = parseLocalDateSafe(norm.get("endDate"));
                    if (d != null) request.setEndDate(d);
                }

                // performanceLocation: if project provides locations, pick first if empty
                if (isBlank(request.getPerformanceLocation())) {
                    Object locObj = norm.get("locations");
                    if (locObj instanceof List<?> list && !list.isEmpty()) {
                        request.setPerformanceLocation(String.valueOf(list.get(0)));
                    }
                }

                // taskDescription autofill (if missing)
                if (isBlank(request.getTaskDescription())) {
                    // from raw project
                    Object raw = norm.get("raw");
                    if (raw instanceof Map<?, ?> rawMap) {
                        String td = asString(((Map<?, ?>) rawMap).get("taskDescription"));
                        if (!isBlank(td)) request.setTaskDescription(td);
                    }
                }

                // requiredLanguages from selectedSkills (ONLY if missing)
                if (request.getRequiredLanguages() == null || request.getRequiredLanguages().isEmpty()) {
                    Object skillsObj = norm.get("skills");
                    if (skillsObj instanceof List<?> list && !list.isEmpty()) {
                        List<String> langs = list.stream().map(String::valueOf).toList();
                        request.setRequiredLanguages(langs);
                    }
                }

                // furtherInformation (links + skills) ONLY if missing
                if (isBlank(request.getFurtherInformation())) {
                    Object raw = norm.get("raw");
                    String links = null;
                    if (raw instanceof Map<?, ?> rawMap) {
                        links = asString(((Map<?, ?>) rawMap).get("links"));
                    }

                    String skillsLine = "";
                    Object skillsObj = norm.get("skills");
                    if (skillsObj instanceof List<?> list && !list.isEmpty()) {
                        skillsLine = "Skills: " + list.stream().map(String::valueOf).reduce((a, b) -> a + ", " + b).orElse("");
                    }

                    String out = "";
                    if (!isBlank(links)) out += "Link: " + links;
                    if (!isBlank(skillsLine)) out += (out.isBlank() ? "" : "\n") + skillsLine;

                    if (!out.isBlank()) request.setFurtherInformation(out);
                }

                // ✅ ROLES autofill from project roles (ONLY if missing)
                if (request.getRoles() == null || request.getRoles().isEmpty()) {
                    Object rolesObj = norm.get("roles");
                    if (rolesObj instanceof List<?> list && !list.isEmpty()) {

                        List<RequestedRole> rr = list.stream()
                                .filter(x -> x instanceof Map<?, ?>)
                                .map(x -> (Map<String, Object>) x)
                                .map(rm -> {
                                    RequestedRole r = new RequestedRole();

                                    // roleName
                                    String roleName = asString(rm.get("roleName"));
                                    r.setRoleName(roleName);

                                    // technology from first competency (or null)
                                    Object compsObj = rm.get("competencies");
                                    if (compsObj instanceof List<?> comps && !comps.isEmpty()) {
                                        r.setTechnology(String.valueOf(comps.get(0)));
                                    }

                                    // manDays from capacity/manDays
                                    Object md = rm.get("manDays");
                                    if (md != null) {
                                        try {
                                            r.setManDays(Integer.parseInt(String.valueOf(md)));
                                        } catch (Exception ignored) {
                                        }
                                    }

                                    // domain/experience not provided by Group-1 => keep null (UI can edit)
                                    r.setDomain(null);
                                    r.setExperienceLevel(null);
                                    r.setOnsiteDays(null);

                                    return r;
                                })
                                .toList();

                        request.setRoles(rr);
                    }
                }
            }
        }

        // ---------- CONTRACT ----------
        // Group-2 rule: contract must exist, supplier can be filled from contract if missing
        if (!isBlank(request.getContractId()) && isBlank(request.getContractSupplier())) {
            Map<String, Object> contract = externalReferenceService.getContract(request.getContractId());
            if (contract != null) {
                String supplier = extractContractSupplierSafe(contract);
                if (!isBlank(supplier)) request.setContractSupplier(supplier);
            }
        }
    }

    /**
     * ✅ NEW: Group-2 contract check (external)
     * - Contract must exist
     * - If API contains approved=false, then reject
     */
    private void validateContractGroup2(ServiceRequest request) {
        if (request == null) return;

        if (isBlank(request.getContractId())) {
            throw new IllegalStateException("Contract reference is mandatory (Group-2 rule)");
        }

        Map<String, Object> contract = externalReferenceService.getContract(request.getContractId());
        if (contract == null) {
            throw new IllegalStateException("Referenced contract does not exist (Group-2 rule)");
        }

        // 1) If "approved" exists and is false -> block
        Object approved = contract.get("approved");
        if (approved instanceof Boolean b && !b) {
            throw new IllegalStateException("Referenced contract is not approved (Group-2 rule)");
        }

        Object isApproved = contract.get("isApproved");
        if (isApproved instanceof Boolean b && !b) {
            throw new IllegalStateException("Referenced contract is not approved (Group-2 rule)");
        }

        // 2) If approval is expressed via workflow.finalApproval.approvedAt
        Object wf = contract.get("workflow");
        if (wf instanceof Map<?, ?> wfMap) {
            Object finalApproval = ((Map<?, ?>) wfMap).get("finalApproval");
            if (finalApproval instanceof Map<?, ?> faMap) {
                Object approvedAt = ((Map<?, ?>) faMap).get("approvedAt");
                // approvedAt exists => approved
                if (approvedAt != null && String.valueOf(approvedAt).trim().length() > 0) return;
            }
        }

        // If no explicit approval fields exist, allow (backward compatible)
        // But if contract explicitly has approval fields and none indicate approval, block:
        boolean hasAnyApprovalSignal =
                contract.containsKey("approved") || contract.containsKey("isApproved") || contract.containsKey("workflow");

        if (hasAnyApprovalSignal && approved instanceof Boolean b && !b) {
            throw new IllegalStateException("Referenced contract is not approved (Group-2 rule)");
        }
    }

    // --------------------------------------------------
    // CREATE REQUEST (Group-1 & Group-2 + Autofill)
    // --------------------------------------------------

    @Override
    public ServiceRequest createRequest(ServiceRequest request) {

        User current = getCurrentUser();

        if (current.getRole() != Role.PROJECT_MANAGER) {
            throw new RuntimeException("Only PROJECT_MANAGER can create service requests");
        }

        // ✅ Autofill FIRST (project might bring contractId etc.)
        autofillFromExternalProject(request);

        // ✅ Group-1: only allow if no internal resource could be found
        // (your model uses externalSearch Boolean; default true)
        if (!Boolean.TRUE.equals(request.getExternalSearch())) {
            throw new IllegalStateException(
                    "Service request not allowed: internal resource available (Group-1 rule)"
            );
        }

        // ✅ Group-2: referenced contract must exist (and be approved if field exists)
        validateContractGroup2(request);

        request.setRequestedByUsername(current.getUsername());
        request.setRequestedByRole(current.getRole().name());

        if (request.getStatus() == null) {
            request.setStatus(RequestStatus.DRAFT);
        }

        if (request.getRequestNumber() == null || request.getRequestNumber().isBlank()) {
            request.setRequestNumber(generateUniqueRequestNumber());
        }

        ensureBiddingFields(request);

        ServiceRequest saved = requestRepository.save(request);

        notificationService.sendToRole(
                Role.PROCUREMENT_OFFICER,
                "New draft service request created: " + saved.getTitle()
        );

        return saved;
    }

    // --------------------------------------------------
    // Everything below = YOUR EXISTING LOGIC (UNCHANGED)
    // --------------------------------------------------

    @Override
    public Optional<ServiceRequest> getRequestById(Long id) {
        return requestRepository.findById(id);
    }

    @Override
    public List<ServiceRequest> getAllRequests() {
        User current = getCurrentUserOrNull();

        // ✅ Public (no JWT): allow list
        if (current == null) {
            return requestRepository.findAll();
        }

        // ✅ IMPORTANT: Procurement Officer must see all
        if (current.getRole() == Role.ADMIN
                || current.getRole() == Role.RESOURCE_PLANNER
                || current.getRole() == Role.PROCUREMENT_OFFICER) {
            return requestRepository.findAll();
        }

        // ✅ PM sees only their own requests
        if (current.getRole() == Role.PROJECT_MANAGER) {
            return requestRepository.findAll().stream()
                    .filter(r -> current.getUsername().equals(r.getRequestedByUsername()))
                    .toList();
        }

        return List.of();
    }

    @Override
    public Optional<ServiceRequest> updateRequest(Long id, ServiceRequest updated) {
        return requestRepository.findById(id).map(existing -> {

            requirePmOwner(existing); // ✅ NEW

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
            existing.setRoles(updated.getRoles());

            existing.setRequiredLanguages(updated.getRequiredLanguages());
            existing.setMustHaveCriteria(updated.getMustHaveCriteria());
            existing.setNiceToHaveCriteria(updated.getNiceToHaveCriteria());
            existing.setTaskDescription(updated.getTaskDescription());
            existing.setFurtherInformation(updated.getFurtherInformation());

            // ✅ NEW: If they changed projectId/contractId, autofill missing fields again
            autofillFromExternalProject(existing);

            // ✅ Group-2 still enforced on update if they changed contractId
            validateContractGroup2(existing);

            return requestRepository.save(existing);
        });
    }

    @Override
    public boolean deleteRequest(Long id) {
        ServiceRequest req = requestRepository.findById(id).orElse(null);
        if (req == null) return false;

        requirePmOwner(req); // ✅ NEW

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

        requirePmOwner(req); // ✅ NEW

        if (req.getStatus() != RequestStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT requests can be submitted");
        }

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

        Instant now = Instant.now();

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
    public ServiceOffer addOffer(Long requestId, ServiceOffer incoming) {

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

        // ✅ IMPORTANT: Always create a NEW entity instance (never save/merge the incoming one)
        ServiceOffer offer = new ServiceOffer();
        offer.setServiceRequest(request);

        // ✅ NEW: persist providerOfferId (this was missing, causing provider_offer_id = NULL)
        offer.setProviderOfferId(incoming.getProviderOfferId());

        // copy only allowed fields (legacy/backward compatible)
        offer.setSpecialistName(incoming.getSpecialistName());
        offer.setMaterialNumber(incoming.getMaterialNumber());

        offer.setDailyRate(incoming.getDailyRate());
        offer.setTravellingCost(incoming.getTravellingCost());
        offer.setTotalCost(incoming.getTotalCost());

        offer.setContractualRelationship(incoming.getContractualRelationship());
        offer.setSubcontractorCompany(incoming.getSubcontractorCompany());

        offer.setMatchMustHaveCriteria(incoming.isMatchMustHaveCriteria());
        offer.setMatchNiceToHaveCriteria(incoming.isMatchNiceToHaveCriteria());
        offer.setMatchLanguageSkills(incoming.isMatchLanguageSkills());

        offer.setSupplierName(incoming.getSupplierName());
        offer.setSupplierRepresentative(incoming.getSupplierRepresentative());

// ✅ NEW: copy specialists[] (provider payload support)
        if (incoming.getSpecialists() != null && !incoming.getSpecialists().isEmpty()) {
            for (var s : incoming.getSpecialists()) {
                if (s == null) continue;

                ServiceOfferSpecialist child = new ServiceOfferSpecialist();
                child.setUserId(s.getUserId());
                child.setName(s.getName());
                child.setMaterialNumber(s.getMaterialNumber());

                child.setDailyRate(s.getDailyRate());
                child.setTravellingCost(s.getTravellingCost());
                child.setSpecialistCost(s.getSpecialistCost());

                child.setMatchMustHaveCriteria(s.getMatchMustHaveCriteria());
                child.setMatchNiceToHaveCriteria(s.getMatchNiceToHaveCriteria());
                child.setMatchLanguageSkills(s.getMatchLanguageSkills());

                offer.addSpecialist(child);
            }
        }


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

        requirePmOwner(req); // ✅ NEW

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

        try {
            offerRepository.deleteByServiceRequestId(id);
        } catch (Exception ignored) {
        }
        try {
            orderRepository.deleteByServiceRequestId(id);
        } catch (Exception ignored) {
        }

        requestRepository.deleteById(id);

        notificationService.sendToUsername("admin",
                "ADMIN deleted service request: " + req.getTitle() + " (#" + id + ")"
        );

        return true;
    }

    @Override
    public void pullProviderOffers(Long requestId) {
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        ensureBiddingFields(req);

        if (req.getBiddingActive() == null || !req.getBiddingActive()) {
            throw new IllegalStateException("Bidding is not active for this request.");
        }

        if (req.getBiddingEndAt() != null && Instant.now().isAfter(req.getBiddingEndAt())) {
            req.setBiddingActive(false);
            req.setStatus(RequestStatus.EXPIRED);
            requestRepository.save(req);
            throw new IllegalStateException("Bidding window expired.");
        }

        // ✅ provider client disabled / not present -> do nothing (no crash)
        if (providerClient.isEmpty()) return;

        String externalRequestId = req.getRequestNumber();

        List<ProviderOfferDTO> externalOffers = providerClient.get().fetchAllOffers();
        if (externalOffers == null || externalOffers.isEmpty()) return;

        List<ProviderOfferDTO> matches = externalOffers.stream()
                .filter(o -> o != null && externalRequestId != null && externalRequestId.equals(o.requestId))
                .collect(Collectors.toList());

        if (matches.isEmpty()) return;

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

        if (inserted > 0 && req.getStatus() == RequestStatus.APPROVED_FOR_BIDDING) {
            req.setStatus(RequestStatus.BIDDING);
            requestRepository.save(req);
        }

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

        offer.setSupplierName(ext.supplierName != null ? ext.supplierName : "Unknown Supplier");
        offer.setSupplierRepresentative("Provider Portal");

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

        int totalManDays = 0;
        if (req.getRoles() != null) {
            totalManDays = req.getRoles().stream()
                    .map(r -> r.getManDays() != null ? r.getManDays() : 0)
                    .reduce(0, Integer::sum);
        }

        offer.setTotalCost(offer.getDailyRate() * totalManDays + offer.getTravellingCost());

        offer.setMatchMustHaveCriteria(true);
        offer.setMatchNiceToHaveCriteria(true);
        offer.setMatchLanguageSkills(true);

        return offer;
    }

    //hookup // <-- NOTE: Remove this line if it appeared due to copy/paste issues
    // (Your original file continues below unchanged...)
    // ------------------------------------------------------------

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

        if (req.getPreferredOfferId() == null) {
            throw new IllegalStateException("Preferred offer must be selected by PM before final approval.");
        }
        if (!req.getPreferredOfferId().equals(offer.getId())) {
            throw new IllegalStateException("Only the preferred offer can be final approved.");
        }

        if (req.getStatus() != RequestStatus.EVALUATION && req.getStatus() != RequestStatus.BIDDING) {
            throw new IllegalStateException("Final approval allowed only in EVALUATION/BIDDING stage.");
        }

        // Create order
        ServiceOrder order = createServiceOrderFromOffer(offerId, current.getUsername());

        // ✅ THIS is the workflow change:
        // RP final approval means "sent to provider", not provider-approved
        order.setStatus(OrderStatus.SUBMITTED_TO_PROVIDER);
        order.setApprovedAt(Instant.now());
        order.setApprovedBy(current.getUsername());
        order = orderRepository.save(order);

        notificationService.sendToUsername(
                req.getRequestedByUsername(),
                "Resource Planner submitted order to provider for: " + req.getTitle()
        );

        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Order submitted to provider for request: " + req.getTitle()
        );

        return order;
    }

    @Override
    public void applyProviderDecisionFromGroup3(Long offerId, Group3OfferDecisionDTO body) {

        if (body == null || body.getDecision() == null) {
            throw new IllegalArgumentException("decision is required");
        }

        // optional sanity check
        if (body.getServiceOfferId() != null && !body.getServiceOfferId().equals(offerId)) {
            throw new IllegalArgumentException("serviceOfferId mismatch");
        }

        String decision = body.getDecision().trim().toUpperCase();

        // ✅ NEW: offerId from Group3 is providerOfferId, map it to internal offer first
        ServiceOffer internalOffer = getInternalOfferByProviderOfferIdOrThrow(offerId);

        ServiceOrder order = orderRepository.findBySelectedOffer_Id(internalOffer.getId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found for offerId: " + internalOffer.getId()));

        switch (decision) {
            case "SUBMITTED", "SUBMITTED_TO_PROVIDER" -> {
                order.setStatus(OrderStatus.SUBMITTED_TO_PROVIDER);
            }
            case "ACCEPTED" -> {
                order.setStatus(OrderStatus.APPROVED);
                order.setApprovedAt(Instant.now());
                order.setApprovedBy("PROVIDER_GROUP3");
                order.setRejectedAt(null);
                order.setRejectedBy(null);
                order.setRejectionReason(null);
            }
            case "REJECTED" -> {
                order.setStatus(OrderStatus.REJECTED);
                order.setRejectedAt(Instant.now());
                order.setRejectedBy("PROVIDER_GROUP3");
                if (order.getRejectionReason() == null || order.getRejectionReason().isBlank()) {
                    order.setRejectionReason("Rejected by provider system (Group3)");
                }
            }
            default -> throw new IllegalArgumentException("Invalid decision: " + decision);
        }

        orderRepository.save(order);

        // Optional notifications (recommended)
        ServiceRequest req = order.getServiceRequestReference();
        if (req != null) {
            if ("ACCEPTED".equals(decision)) {
                notificationService.sendToUsername(req.getRequestedByUsername(),
                        "Provider accepted the order for request: " + req.getTitle());
            } else if ("REJECTED".equals(decision)) {
                notificationService.sendToUsername(req.getRequestedByUsername(),
                        "Provider rejected the order for request: " + req.getTitle());
            }
        }
    }

    @Override
    public ServiceOrder approveOrderById(Long orderId) {
        User current = getCurrentUser();
        if (current.getRole() != Role.RESOURCE_PLANNER) {
            throw new RuntimeException("Only RESOURCE_PLANNER can approve (submit) service orders.");
        }

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // Only allow RP to act when pending
        if (order.getStatus() != OrderStatus.PENDING_RP_APPROVAL) {
            // idempotent behavior: if already submitted/approved/rejected, return it
            return order;
        }

        // ✅ RP approval means "submitted to provider"
        order.setStatus(OrderStatus.SUBMITTED_TO_PROVIDER);
        order.setApprovedAt(Instant.now());
        order.setApprovedBy(current.getUsername());

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            notificationService.sendToUsername(
                    req.getRequestedByUsername(),
                    "Resource Planner submitted order to provider for: " + req.getTitle()
            );
        }

        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Order #" + saved.getId() + " submitted to provider."
        );

        return saved;
    }

    @Override
    public ServiceOrder rejectOrderById(Long orderId, String reason) {
        User current = getCurrentUser();
        if (current.getRole() != Role.RESOURCE_PLANNER) {
            throw new RuntimeException("Only RESOURCE_PLANNER can reject service orders.");
        }

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING_RP_APPROVAL) {
            // idempotent behavior
            return order;
        }

        order.setStatus(OrderStatus.REJECTED);
        order.setRejectedAt(Instant.now());
        order.setRejectedBy(current.getUsername());
        order.setRejectionReason(reason != null ? reason : "Rejected");

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            notificationService.sendToUsername(
                    req.getRequestedByUsername(),
                    "Service order rejected by Resource Planner: " + (reason == null ? "" : reason)
            );
        }

        notificationService.sendToRole(
                Role.RESOURCE_PLANNER,
                "Order #" + saved.getId() + " rejected."
        );

        return saved;
    }
}
