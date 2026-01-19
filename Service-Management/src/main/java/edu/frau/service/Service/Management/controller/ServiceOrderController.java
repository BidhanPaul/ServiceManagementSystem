package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.*;
import edu.frau.service.Service.Management.service.ServiceOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import edu.frau.service.Service.Management.dto.OrderSubstitutionRequest;
import edu.frau.service.Service.Management.dto.OrderExtensionRequest;
import edu.frau.service.Service.Management.dto.OrderChangeRejectRequest;


@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class ServiceOrderController {

    private final ServiceOrderService orderService;

    public ServiceOrderController(ServiceOrderService orderService) {
        this.orderService = orderService;
    }

    private String currentUsernameOrSystem() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) return auth.getName();
        return "system";
    }

    // ✅ list for current user (PM/RP/Admin)
    @GetMapping
    public ResponseEntity<List<OrderDetailsDTO>> myOrders() {
        return ResponseEntity.ok(orderService.getAllOrdersForCurrentUser());
    }

    // ✅ list orders for a request (PM/RP/Admin)
    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<OrderDetailsDTO>> ordersForRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(orderService.getOrdersForRequest(requestId));
    }

    // ✅ order details page (PM/RP/Admin)
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDetailsDTO> orderDetails(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderDetails(orderId));
    }

    // ✅ RP final approve
    @PostMapping("/{orderId}/approve")
    public ResponseEntity<OrderDetailsDTO> approve(@PathVariable Long orderId) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.approveOrder(orderId, user));
    }

    // ✅ RP reject
    @PostMapping("/{orderId}/reject")
    public ResponseEntity<OrderDetailsDTO> reject(
            @PathVariable Long orderId,
            @RequestBody OrderRejectRequest body
    ) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.rejectOrder(orderId, user, body));
    }

    // ✅ PM feedback
    @PostMapping("/{orderId}/feedback")
    public ResponseEntity<OrderDetailsDTO> feedback(
            @PathVariable Long orderId,
            @RequestBody OrderFeedbackRequest body
    ) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.submitFeedback(orderId, user, body));
    }

    // ✅ substitution request (PM + Supplier Rep)
    @PostMapping("/{orderId}/substitution")
    public ResponseEntity<OrderDetailsDTO> substitution(
            @PathVariable Long orderId,
            @RequestBody OrderSubstitutionRequest body
    ) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.requestSubstitution(orderId, user, body));
    }

    // ✅ extension request (PM only)
    @PostMapping("/{orderId}/extension")
    public ResponseEntity<OrderDetailsDTO> extension(
            @PathVariable Long orderId,
            @RequestBody OrderExtensionRequest body
    ) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.requestExtension(orderId, user, body));
    }

    // ✅ RP approves change request
    @PostMapping("/{orderId}/change/approve")
    public ResponseEntity<OrderDetailsDTO> approveChange(@PathVariable Long orderId) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.approveChange(orderId, user));
    }

    // ✅ RP rejects change request
    @PostMapping("/{orderId}/change/reject")
    public ResponseEntity<OrderDetailsDTO> rejectChange(
            @PathVariable Long orderId,
            @RequestBody OrderChangeRejectRequest body
    ) {
        String user = currentUsernameOrSystem();
        return ResponseEntity.ok(orderService.rejectChange(orderId, user, body));
    }

}
