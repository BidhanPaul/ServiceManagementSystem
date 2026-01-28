package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.dto.*;
import edu.frau.service.Service.Management.model.*;
import edu.frau.service.Service.Management.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import edu.frau.service.Service.Management.integration.provider.Group3IntegrationClient;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceOrderServiceImpl implements ServiceOrderService {

    private final ServiceOrderRepository orderRepository;
    private final ServiceOrderFeedbackRepository feedbackRepository;
    private final ServiceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ✅ Group3 provider integration
    private final Group3IntegrationClient group3Client;

    public ServiceOrderServiceImpl(
            ServiceOrderRepository orderRepository,
            ServiceOrderFeedbackRepository feedbackRepository,
            ServiceRequestRepository requestRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            Group3IntegrationClient group3Client
    ) {
        this.orderRepository = orderRepository;
        this.feedbackRepository = feedbackRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.group3Client = group3Client;
    }

    // ---------------- helpers ----------------
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new RuntimeException("Not authenticated");
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private void clearPendingChangeFields(ServiceOrder order) {
        order.setPendingChangeType(null);

        order.setPendingNewSpecialistName(null);

        order.setPendingNewEndDate(null);
        order.setPendingNewManDays(null);
        order.setPendingNewContractValue(null);

        order.setPendingChangeComment(null);
        order.setPendingChangeRequestedBy(null);
        order.setPendingChangeRequestedAt(null);

        // keep decision fields already stored
        // keep pendingSubstitutionDate for history; uncomment if you want to clear:
        // order.setPendingSubstitutionDate(null);
    }

    private OrderDetailsDTO toDTO(ServiceOrder o) {
        OrderDetailsDTO dto = new OrderDetailsDTO();

        dto.id = o.getId();
        dto.status = o.getStatus();

        dto.title = o.getTitle();

        if (o.getServiceRequestReference() != null) {
            dto.requestId = o.getServiceRequestReference().getId();
            dto.requestNumber = o.getServiceRequestReference().getRequestNumber();
        }

        dto.startDate = o.getStartDate();
        dto.endDate = o.getEndDate();
        dto.location = o.getLocation();

        dto.supplierName = o.getSupplierName();
        dto.supplierRepresentative = o.getSupplierRepresentative();
        dto.specialistName = o.getSpecialistName();

        dto.role = o.getRole();
        dto.manDays = o.getManDays();
        dto.contractValue = o.getContractValue();

        dto.pendingSubstitutionDate =
                o.getPendingSubstitutionDate() == null ? null : o.getPendingSubstitutionDate().toString();

        // selected offer details
        if (o.getSelectedOffer() != null) {
            ServiceOffer so = o.getSelectedOffer();
            dto.offerId = so.getId();
            dto.materialNumber = so.getMaterialNumber();
            dto.dailyRate = so.getDailyRate();
            dto.travellingCost = so.getTravellingCost();
            dto.contractualRelationship = so.getContractualRelationship();
            dto.subcontractorCompany = so.getSubcontractorCompany();
        }

        dto.createdAt = o.getCreatedAt();
        dto.createdBy = o.getCreatedBy();
        dto.approvedAt = o.getApprovedAt();
        dto.approvedBy = o.getApprovedBy();
        dto.rejectedAt = o.getRejectedAt();
        dto.rejectedBy = o.getRejectedBy();
        dto.rejectionReason = o.getRejectionReason();

        // feedback (optional)
        feedbackRepository.findByServiceOrderId(o.getId()).ifPresent(fb -> {
            dto.rating = fb.getRating();
            dto.feedbackComment = fb.getComment();
            dto.feedbackCreatedAt = fb.getCreatedAt();
            dto.feedbackCreatedBy = fb.getCreatedBy();
        });

        // ---- change request fields ----
        dto.pendingChangeType = o.getPendingChangeType() == null ? null : o.getPendingChangeType().name();
        dto.pendingChangeStatus = o.getPendingChangeStatus() == null ? null : o.getPendingChangeStatus().name();

        dto.pendingNewSpecialistName = o.getPendingNewSpecialistName();

        dto.pendingNewEndDate = o.getPendingNewEndDate() == null ? null : o.getPendingNewEndDate().toString();
        dto.pendingNewManDays = o.getPendingNewManDays();
        dto.pendingNewContractValue = o.getPendingNewContractValue();

        dto.pendingChangeComment = o.getPendingChangeComment();
        dto.pendingChangeRequestedBy = o.getPendingChangeRequestedBy();
        dto.pendingChangeRequestedAt = o.getPendingChangeRequestedAt() == null ? null : o.getPendingChangeRequestedAt().toString();

        dto.pendingChangeDecisionBy = o.getPendingChangeDecisionBy();
        dto.pendingChangeDecisionAt = o.getPendingChangeDecisionAt() == null ? null : o.getPendingChangeDecisionAt().toString();

        dto.pendingChangeRejectionReason = o.getPendingChangeRejectionReason();

        return dto;
    }

    private void requireRole(User user, Role role) {
        if (user.getRole() != role) throw new RuntimeException("Forbidden: requires " + role);
    }

    private void ensureNoPendingChange(ServiceOrder order) {
        if (order.getPendingChangeStatus() == OrderChangeStatus.PENDING) {
            throw new IllegalStateException("A change request is already pending for this order.");
        }
    }

    // ---------------- queries ----------------

    @Override
    public List<OrderDetailsDTO> getAllOrdersForCurrentUser() {
        User user = currentUser();

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.RESOURCE_PLANNER) {
            return orderRepository.findAll().stream()
                    .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }

        if (user.getRole() == Role.PROJECT_MANAGER) {
            return orderRepository.findAll().stream()
                    .filter(o -> o.getServiceRequestReference() != null
                            && user.getUsername().equals(o.getServiceRequestReference().getRequestedByUsername()))
                    .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    public List<OrderDetailsDTO> getOrdersForRequest(Long requestId) {
        User user = currentUser();
        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (user.getRole() == Role.PROJECT_MANAGER && !user.getUsername().equals(req.getRequestedByUsername())) {
            throw new RuntimeException("Forbidden: not your request");
        }

        return orderRepository.findByServiceRequestReferenceIdOrderByIdDesc(requestId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public OrderDetailsDTO getOrderDetails(Long orderId) {
        User user = currentUser();
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (user.getRole() == Role.PROJECT_MANAGER) {
            ServiceRequest req = order.getServiceRequestReference();
            if (req == null || !user.getUsername().equals(req.getRequestedByUsername())) {
                throw new RuntimeException("Forbidden: not your order");
            }
        }

        return toDTO(order);
    }

    // ---------------- RP approval (submit to provider) ----------------
    @Override
    public OrderDetailsDTO approveOrder(Long orderId, String rpUsername) {
        User user = currentUser();
        requireRole(user, Role.RESOURCE_PLANNER);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_RP_APPROVAL) {
            throw new IllegalStateException("Only PENDING_RP_APPROVAL can be approved");
        }

        // ✅ Must have selected offer to notify provider
        if (order.getSelectedOffer() == null) {
            throw new IllegalStateException("Order has no selected offer to notify provider.");
        }

        ServiceOffer selected = order.getSelectedOffer();

        // ✅ IMPORTANT: provider needs providerOfferId (not local DB id)
        if (selected.getProviderOfferId() == null) {
            throw new IllegalStateException(
                    "Selected offer has no providerOfferId; cannot notify provider. " +
                            "Make sure provider_offer_id is being saved when offers are created/imported."
            );
        }

        Long providerOfferId = selected.getProviderOfferId();

        /**
         * ✅ FIX (matches your lifecycle):
         * RP Approve button = "submit to provider"
         * => send decision SUBMITTED
         *
         * Provider later decides ACCEPTED / REJECTED (webhook / their UI)
         */
        try {
            group3Client.sendDecision(providerOfferId, "ACCEPTED");
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Failed to notify Group3 about SUBMITTED decision for providerOfferId=" + providerOfferId,
                    ex
            );
        }

        // ✅ After successful provider notification:
        order.setStatus(OrderStatus.SUBMITTED_TO_PROVIDER);

        // RP audit (kept)
        order.setApprovedAt(Instant.now());
        order.setApprovedBy(rpUsername);

        ServiceOrder saved = orderRepository.save(order);

        // Keep your existing request updates/notification logic (unchanged)
        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            req.setStatus(RequestStatus.ORDERED);
            req.setBiddingActive(false);
            requestRepository.save(req);

            notificationService.sendToUsername(req.getRequestedByUsername(),
                    "Resource Planner submitted order to provider for: " + req.getTitle()
                            + " (Order #" + saved.getId() + ")");
        }

        return toDTO(saved);
    }

    @Override
    public OrderDetailsDTO rejectOrder(Long orderId, String rpUsername, OrderRejectRequest body) {
        User user = currentUser();
        requireRole(user, Role.RESOURCE_PLANNER);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_RP_APPROVAL) {
            throw new IllegalStateException("Only PENDING_RP_APPROVAL can be rejected");
        }

        // ✅ If an offer was selected, tell provider REJECTED
        if (order.getSelectedOffer() != null) {
            ServiceOffer selected = order.getSelectedOffer();

            if (selected.getProviderOfferId() != null) {
                Long providerOfferId = selected.getProviderOfferId();
                try {
                    group3Client.sendDecision(providerOfferId, "REJECTED");
                } catch (Exception ex) {
                    throw new IllegalStateException(
                            "Failed to notify Group3 about REJECTED decision for providerOfferId=" + providerOfferId,
                            ex
                    );
                }
            }
        }

        order.setStatus(OrderStatus.REJECTED);
        order.setRejectedAt(Instant.now());
        order.setRejectedBy(rpUsername);
        order.setRejectionReason(body != null ? body.reason : "Rejected");

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            notificationService.sendToUsername(req.getRequestedByUsername(),
                    "Order rejected by Resource Planner for: " + req.getTitle()
                            + " (Reason: " + saved.getRejectionReason() + ")");
        }

        return toDTO(saved);
    }

    // ---------------- PM feedback ----------------
    @Override
    public OrderDetailsDTO submitFeedback(Long orderId, String pmUsername, OrderFeedbackRequest body) {
        User user = currentUser();
        requireRole(user, Role.PROJECT_MANAGER);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        ServiceRequest req = order.getServiceRequestReference();
        if (req == null || !pmUsername.equals(req.getRequestedByUsername())) {
            throw new RuntimeException("Forbidden: not your order");
        }

        if (body == null || body.rating < 1 || body.rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        if (feedbackRepository.existsByServiceOrderId(orderId)) {
            throw new IllegalStateException("Feedback already submitted for this order");
        }

        ServiceOrderFeedback fb = new ServiceOrderFeedback();
        fb.setServiceOrder(order);
        fb.setRating(body.rating);
        fb.setComment(body.comment);
        fb.setCreatedAt(Instant.now());
        fb.setCreatedBy(pmUsername);

        feedbackRepository.save(fb);

        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "PM submitted feedback for Order #" + order.getId()
                        + " (Rating: " + body.rating + ")");

        return toDTO(order);
    }

    // ---------------- Change Requests ----------------

    @Override
    public OrderDetailsDTO requestSubstitution(Long orderId, String username, OrderSubstitutionRequest body) {
        User user = currentUser();

        if (user.getRole() != Role.PROJECT_MANAGER
                && user.getRole() != Role.ADMIN
                && user.getRole() != Role.SUPPLIER_REPRESENTATIVE) {
            throw new RuntimeException("Forbidden: only PM or Supplier Representative can request substitution");
        }

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException("Change requests are allowed only after the order is APPROVED by provider.");
        }

        if (user.getRole() == Role.PROJECT_MANAGER) {
            ServiceRequest req = order.getServiceRequestReference();
            if (req == null || !user.getUsername().equals(req.getRequestedByUsername())) {
                throw new RuntimeException("Forbidden: not your order");
            }
        }

        if (body == null || body.newSpecialistName == null || body.newSpecialistName.trim().isEmpty()) {
            throw new IllegalArgumentException("newSpecialistName is required");
        }

        if (body.substitutionDate == null) {
            throw new IllegalArgumentException("substitutionDate is required");
        }

        if (order.getStartDate() != null && body.substitutionDate.isBefore(order.getStartDate())) {
            throw new IllegalArgumentException("substitutionDate cannot be before startDate");
        }

        if (order.getEndDate() != null && body.substitutionDate.isAfter(order.getEndDate())) {
            throw new IllegalArgumentException("substitutionDate cannot be after endDate");
        }

        ensureNoPendingChange(order);

        order.setPendingChangeType(OrderChangeType.SUBSTITUTION);
        order.setPendingChangeStatus(OrderChangeStatus.PENDING);
        order.setPendingNewSpecialistName(body.newSpecialistName.trim());
        order.setPendingSubstitutionDate(body.substitutionDate);

        order.setPendingChangeComment(body.comment);
        order.setPendingChangeRequestedBy(username);
        order.setPendingChangeRequestedAt(Instant.now());

        order.setPendingChangeDecisionBy(null);
        order.setPendingChangeDecisionAt(null);
        order.setPendingChangeRejectionReason(null);

        ServiceOrder saved = orderRepository.save(order);

        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "Substitution requested for Order #" + saved.getId()
                        + " → new specialist: " + saved.getPendingNewSpecialistName());

        return toDTO(saved);
    }

    @Override
    public OrderDetailsDTO requestExtension(Long orderId, String username, OrderExtensionRequest body) {
        User user = currentUser();

        if (user.getRole() != Role.PROJECT_MANAGER && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Forbidden: only PM can request extension");
        }

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException("Change requests are allowed only after the order is APPROVED by provider.");
        }

        if (user.getRole() == Role.PROJECT_MANAGER) {
            ServiceRequest req = order.getServiceRequestReference();
            if (req == null || !user.getUsername().equals(req.getRequestedByUsername())) {
                throw new RuntimeException("Forbidden: not your order");
            }
        }

        if (body == null || body.newEndDate == null || body.newManDays == null || body.newContractValue == null) {
            throw new IllegalArgumentException("newEndDate, newManDays, newContractValue are required");
        }

        ensureNoPendingChange(order);

        if (order.getEndDate() != null && !body.newEndDate.isAfter(order.getEndDate())) {
            throw new IllegalArgumentException("newEndDate must be after current endDate");
        }

        if (body.newManDays < order.getManDays()) {
            throw new IllegalArgumentException("newManDays cannot be less than current manDays");
        }
        if (body.newContractValue < order.getContractValue()) {
            throw new IllegalArgumentException("newContractValue cannot be less than current contractValue");
        }

        order.setPendingChangeType(OrderChangeType.EXTENSION);
        order.setPendingChangeStatus(OrderChangeStatus.PENDING);
        order.setPendingNewEndDate(body.newEndDate);
        order.setPendingNewManDays(body.newManDays);
        order.setPendingNewContractValue(body.newContractValue);
        order.setPendingChangeComment(body.comment);
        order.setPendingChangeRequestedBy(username);
        order.setPendingChangeRequestedAt(Instant.now());

        order.setPendingChangeDecisionBy(null);
        order.setPendingChangeDecisionAt(null);
        order.setPendingChangeRejectionReason(null);

        ServiceOrder saved = orderRepository.save(order);

        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "Extension requested for Order #" + saved.getId()
                        + " → endDate: " + body.newEndDate
                        + ", manDays: " + body.newManDays
                        + ", value: " + body.newContractValue);

        return toDTO(saved);
    }

    @Override
    public OrderDetailsDTO approveChange(Long orderId, String rpUsername) {
        User user = currentUser();
        requireRole(user, Role.RESOURCE_PLANNER);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPendingChangeStatus() != OrderChangeStatus.PENDING) {
            throw new IllegalStateException("No pending change request to approve.");
        }

        if (order.getPendingChangeType() == OrderChangeType.SUBSTITUTION) {
            order.setSpecialistName(order.getPendingNewSpecialistName());
        } else if (order.getPendingChangeType() == OrderChangeType.EXTENSION) {
            if (order.getPendingNewEndDate() == null || order.getPendingNewManDays() == null || order.getPendingNewContractValue() == null) {
                throw new IllegalStateException("Pending extension data is incomplete.");
            }
            order.setEndDate(order.getPendingNewEndDate());
            order.setManDays(order.getPendingNewManDays());
            order.setContractValue(order.getPendingNewContractValue());
        }

        order.setPendingChangeStatus(OrderChangeStatus.APPROVED);
        order.setPendingChangeDecisionBy(rpUsername);
        order.setPendingChangeDecisionAt(Instant.now());
        order.setPendingChangeRejectionReason(null);

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            notificationService.sendToUsername(req.getRequestedByUsername(),
                    "Order change approved for Order #" + saved.getId()
                            + " (" + saved.getPendingChangeType() + ")");
        }

        return toDTO(saved);
    }

    @Override
    public OrderDetailsDTO rejectChange(Long orderId, String rpUsername, OrderChangeRejectRequest body) {
        User user = currentUser();
        requireRole(user, Role.RESOURCE_PLANNER);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPendingChangeStatus() != OrderChangeStatus.PENDING) {
            throw new IllegalStateException("No pending change request to reject.");
        }

        order.setPendingChangeStatus(OrderChangeStatus.REJECTED);
        order.setPendingChangeDecisionBy(rpUsername);
        order.setPendingChangeDecisionAt(Instant.now());
        order.setPendingChangeRejectionReason(
                body != null && body.reason != null ? body.reason : "Rejected"
        );

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            notificationService.sendToUsername(req.getRequestedByUsername(),
                    "Order change rejected for Order #" + saved.getId()
                            + " (Reason: " + saved.getPendingChangeRejectionReason() + ")");
        }

        return toDTO(saved);
    }

    @Override
    public OrderDetailsDTO applyGroup4ChangeDecision(Long orderId, Group3ChangeDecisionDTO body) {

        if (body == null || body.decision == null || body.decision.trim().isEmpty()) {
            throw new IllegalArgumentException("decision is required");
        }

        String decision = body.decision.trim().toUpperCase();

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPendingChangeStatus() != OrderChangeStatus.PENDING) {
            throw new IllegalStateException("No pending change request exists for this order.");
        }

        if ("ACCEPTED".equals(decision) || "APPROVED".equals(decision)) {

            if (order.getPendingChangeType() == OrderChangeType.SUBSTITUTION) {

                if (order.getPendingNewSpecialistName() == null || order.getPendingNewSpecialistName().trim().isEmpty()) {
                    throw new IllegalStateException("Pending substitution data is incomplete.");
                }

                order.setSpecialistName(order.getPendingNewSpecialistName());

            } else if (order.getPendingChangeType() == OrderChangeType.EXTENSION) {

                if (order.getPendingNewEndDate() == null
                        || order.getPendingNewManDays() == null
                        || order.getPendingNewContractValue() == null) {
                    throw new IllegalStateException("Pending extension data is incomplete.");
                }

                order.setEndDate(order.getPendingNewEndDate());
                order.setManDays(order.getPendingNewManDays());
                order.setContractValue(order.getPendingNewContractValue());

            } else {
                throw new IllegalStateException("Unknown pending change type.");
            }

            order.setPendingChangeStatus(OrderChangeStatus.APPROVED);
            order.setPendingChangeDecisionBy("GROUP4");
            order.setPendingChangeDecisionAt(Instant.now());
            order.setPendingChangeRejectionReason(null);

            clearPendingChangeFields(order);

        } else if ("REJECTED".equals(decision)) {

            order.setPendingChangeStatus(OrderChangeStatus.REJECTED);
            order.setPendingChangeDecisionBy("GROUP4");
            order.setPendingChangeDecisionAt(Instant.now());
            order.setPendingChangeRejectionReason(
                    body.reason != null ? body.reason : "Rejected"
            );

            clearPendingChangeFields(order);

        } else {
            throw new IllegalArgumentException("Invalid decision: " + body.decision + " (use ACCEPTED or REJECTED)");
        }

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            if (saved.getPendingChangeStatus() == OrderChangeStatus.APPROVED) {
                notificationService.sendToUsername(req.getRequestedByUsername(),
                        "Group4 accepted order change for Order #" + saved.getId());
            } else if (saved.getPendingChangeStatus() == OrderChangeStatus.REJECTED) {
                notificationService.sendToUsername(req.getRequestedByUsername(),
                        "Group4 rejected order change for Order #" + saved.getId()
                                + " (Reason: " + saved.getPendingChangeRejectionReason() + ")");
            }
        }

        return toDTO(saved);
    }
}
