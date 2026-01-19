package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.dto.*;
import edu.frau.service.Service.Management.model.*;
import edu.frau.service.Service.Management.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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

    public ServiceOrderServiceImpl(
            ServiceOrderRepository orderRepository,
            ServiceOrderFeedbackRepository feedbackRepository,
            ServiceRequestRepository requestRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.orderRepository = orderRepository;
        this.feedbackRepository = feedbackRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ---------------- helpers ----------------
    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new RuntimeException("Not authenticated");
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
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

        // ---- change request fields (NEW) ----
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

    // NEW helper: prevent multiple pending requests
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

    // ---------------- RP final approval ----------------

    @Override
    public OrderDetailsDTO approveOrder(Long orderId, String rpUsername) {
        User user = currentUser();
        requireRole(user, Role.RESOURCE_PLANNER);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_RP_APPROVAL) {
            throw new IllegalStateException("Only PENDING_RP_APPROVAL can be approved");
        }

        order.setStatus(OrderStatus.APPROVED);
        order.setApprovedAt(Instant.now());
        order.setApprovedBy(rpUsername);

        ServiceOrder saved = orderRepository.save(order);

        ServiceRequest req = saved.getServiceRequestReference();
        if (req != null) {
            req.setStatus(RequestStatus.ORDERED);
            req.setBiddingActive(false);
            requestRepository.save(req);

            notificationService.sendToUsername(req.getRequestedByUsername(),
                    "Resource Planner approved order for: " + req.getTitle() + " (Order #" + saved.getId() + ")");
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

    // ---------------- Change Requests (NEW) ----------------

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

        if (user.getRole() == Role.PROJECT_MANAGER) {
            ServiceRequest req = order.getServiceRequestReference();
            if (req == null || !user.getUsername().equals(req.getRequestedByUsername())) {
                throw new RuntimeException("Forbidden: not your order");
            }
        }

        if (body == null || body.newSpecialistName == null || body.newSpecialistName.trim().isEmpty()) {
            throw new IllegalArgumentException("newSpecialistName is required");
        }

        ensureNoPendingChange(order);

        order.setPendingChangeType(OrderChangeType.SUBSTITUTION);
        order.setPendingChangeStatus(OrderChangeStatus.PENDING);
        order.setPendingNewSpecialistName(body.newSpecialistName.trim());
        order.setPendingChangeComment(body.comment);
        order.setPendingChangeRequestedBy(username);
        order.setPendingChangeRequestedAt(Instant.now());

        order.setPendingChangeDecisionBy(null);
        order.setPendingChangeDecisionAt(null);
        order.setPendingChangeRejectionReason(null);

        ServiceOrder saved = orderRepository.save(order);

        notificationService.sendToRole(Role.RESOURCE_PLANNER,
                "Substitution requested for Order #" + saved.getId() + " → new specialist: " + saved.getPendingNewSpecialistName());

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

        // ✅ FIXED sanity checks (manDays=int, contractValue=double -> never null)
        if (order.getStartDate() != null && body.newEndDate.isBefore(order.getStartDate())) {
            throw new IllegalArgumentException("newEndDate cannot be before startDate");
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

        // ✅ Apply change safely (manDays=int, contractValue=double)
        if (order.getPendingChangeType() == OrderChangeType.SUBSTITUTION) {
            order.setSpecialistName(order.getPendingNewSpecialistName());
        } else if (order.getPendingChangeType() == OrderChangeType.EXTENSION) {
            if (order.getPendingNewEndDate() == null || order.getPendingNewManDays() == null || order.getPendingNewContractValue() == null) {
                throw new IllegalStateException("Pending extension data is incomplete.");
            }
            order.setEndDate(order.getPendingNewEndDate());
            order.setManDays(order.getPendingNewManDays());                 // Integer -> int (safe after null check)
            order.setContractValue(order.getPendingNewContractValue());     // Double -> double (safe after null check)
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
}
