package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.Group3ChangeDecisionDTO;
import edu.frau.service.Service.Management.dto.OrderDetailsDTO;
import edu.frau.service.Service.Management.service.ServiceOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/provider/group4")
public class Group4WebhookController {

    private final ServiceOrderService orderService;

    public Group4WebhookController(ServiceOrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Provider sends decision for substitution / extension
     *
     * POST /api/public/provider/group4/order-changes/{providerOrderId}/decision
     *
     * Body:
     * {
     *   "decision": "ACCEPTED" | "REJECTED",
     *   "reason": "optional"
     * }
     */
    @PostMapping("/order-changes/{providerOrderId}/decision")
    public ResponseEntity<OrderDetailsDTO> changeDecision(
            @PathVariable Long providerOrderId,
            @RequestBody Group3ChangeDecisionDTO body
    ) {
        return ResponseEntity.ok(
                orderService.applyGroup4ChangeDecision(providerOrderId, body)
        );
    }
}
