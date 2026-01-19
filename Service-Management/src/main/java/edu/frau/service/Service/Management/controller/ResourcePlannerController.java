package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOrder;
import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resource-planner")
public class ResourcePlannerController {

    private final RequestService requestService;

    public ResourcePlannerController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * ✅ Final approval by Resource Planner only.
     * Creates Service Order from the selected offer.
     */
    @PostMapping("/final-approve/{offerId}")
    @PreAuthorize("hasRole('RESOURCE_PLANNER')")
    public ResponseEntity<ServiceOrder> finalApprove(@PathVariable Long offerId) {
        ServiceOrder order = requestService.finalApproveAndCreateOrder(offerId);
        return ResponseEntity.ok(order);
    }
}
