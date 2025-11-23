package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceOrder;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class ServiceRequestController {

    @Autowired
    private RequestService requestService;

    // === BASIC CRUD ===

    @PostMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ServiceRequest> createRequest(@RequestBody ServiceRequest request,
                                                        Principal principal) {
        // Optionally set requestedByUsername from logged in user
        if (principal != null && request.getRequestedByUsername() == null) {
            request.setRequestedByUsername(principal.getName());
        }
        return ResponseEntity.ok(requestService.createRequest(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequest> getRequest(@PathVariable Long id) {
        return requestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<ServiceRequest>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ADMIN')")
    public ResponseEntity<ServiceRequest> updateRequest(@PathVariable Long id,
                                                        @RequestBody ServiceRequest request) {
        return requestService.updateRequest(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ADMIN')")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        if (requestService.deleteRequest(id)) return ResponseEntity.ok().build();
        return ResponseEntity.notFound().build();
    }

    // === WORKFLOW ===

    @PutMapping("/{id}/submit")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ServiceRequest> submitForReview(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(requestService.submitForReview(id,
                principal != null ? principal.getName() : null));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('PROCUREMENT_OFFICER')")
    public ResponseEntity<ServiceRequest> approveForBidding(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(requestService.approveForBidding(id,
                principal != null ? principal.getName() : null));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('PROCUREMENT_OFFICER')")
    public ResponseEntity<ServiceRequest> reject(@PathVariable Long id,
                                                 @RequestParam String reason,
                                                 Principal principal) {
        return ResponseEntity.ok(requestService.reject(id,
                principal != null ? principal.getName() : null, reason));
    }

    // === OFFERS (group 4 simulation) ===

    @PostMapping("/{id}/offers")
    @PreAuthorize("hasAnyRole('SERVICE_PROVIDER','SUPPLIER_REPRESENTATIVE')")
    public ResponseEntity<ServiceOffer> addOffer(@PathVariable Long id,
                                                 @RequestBody ServiceOffer offer) {
        return ResponseEntity.ok(requestService.addOffer(id, offer));
    }

    @GetMapping("/{id}/offers")
    public ResponseEntity<List<ServiceOffer>> getOffers(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.getOffersForRequest(id));
    }

    @PutMapping("/{id}/offers/{offerId}/select")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','RESOURCE_PLANNER')")
    public ResponseEntity<ServiceRequest> selectPreferredOffer(@PathVariable Long id,
                                                               @PathVariable Long offerId,
                                                               Principal principal) {
        return ResponseEntity.ok(requestService.selectPreferredOffer(
                id, offerId, principal != null ? principal.getName() : null));
    }

    // === SERVICE ORDER ===

    @PostMapping("/offers/{offerId}/order")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','RESOURCE_PLANNER')")
    public ResponseEntity<ServiceOrder> createOrder(@PathVariable Long offerId,
                                                    Principal principal) {
        return ResponseEntity.ok(requestService.createServiceOrderFromOffer(
                offerId, principal != null ? principal.getName() : null));
    }
}
