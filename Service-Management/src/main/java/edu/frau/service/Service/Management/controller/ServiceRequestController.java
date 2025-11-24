package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceOrder;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/requests")
@CrossOrigin(origins = "*")
public class ServiceRequestController {

    @Autowired
    private RequestService requestService;

    @GetMapping
    public List<ServiceRequest> getAll() {
        return requestService.getAllRequests();
    }

    @PostMapping
    public ServiceRequest create(@RequestBody ServiceRequest request) {
        return requestService.createRequest(request);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequest> getById(@PathVariable Long id) {
        return requestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceRequest> update(
            @PathVariable Long id,
            @RequestBody ServiceRequest updated
    ) {
        try {
            return requestService.updateRequest(id, updated)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).build(); // conflict (not DRAFT)
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            boolean deleted = requestService.deleteRequest(id);
            if (!deleted) return ResponseEntity.notFound().build();
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).build(); // conflict (not DRAFT)
        }
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<ServiceRequest> submit(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.submitForReview(id, "system"));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ServiceRequest> approve(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.approveForBidding(id, "system"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ServiceRequest> reject(
            @PathVariable Long id,
            @RequestBody String reason
    ) {
        return ResponseEntity.ok(requestService.reject(id, "system", reason));
    }

    // ---- offers ----

    @GetMapping("/{id}/offers")
    public List<ServiceOffer> getOffers(@PathVariable Long id) {
        return requestService.getOffersForRequest(id);
    }

    @PostMapping("/{id}/offers")
    public ServiceOffer addOffer(
            @PathVariable Long id,
            @RequestBody ServiceOffer offer
    ) {
        return requestService.addOffer(id, offer);
    }

    @PutMapping("/{id}/offers/{offerId}/select")
    public ResponseEntity<ServiceRequest> selectPreferred(
            @PathVariable Long id,
            @PathVariable Long offerId
    ) {
        return ResponseEntity.ok(requestService.selectPreferredOffer(id, offerId, "system"));
    }

    @PostMapping("/offers/{offerId}/order")
    public ResponseEntity<ServiceOrder> createOrder(@PathVariable Long offerId) {
        return ResponseEntity.ok(requestService.createServiceOrderFromOffer(offerId, "system"));
    }
}
