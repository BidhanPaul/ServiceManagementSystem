package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.OrderDetailsDTO;
import edu.frau.service.Service.Management.dto.OrderExtensionRequest;
import edu.frau.service.Service.Management.dto.OrderSubstitutionRequest;
import edu.frau.service.Service.Management.service.ServiceOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/order-changes")
public class PublicOrderChangesController {

    private final ServiceOrderService orderService;

    public PublicOrderChangesController(ServiceOrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * ✅ No {orderId} in URL
     * POST /api/public/order-changes/extension
     */
    @PostMapping("/extension")
    public ResponseEntity<OrderDetailsDTO> extension(@RequestBody PublicExtensionRequest req) {
        if (req == null || req.orderId == null || req.body == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.requestExtension(req.orderId, "system", req.body));
    }

    /**
     * ✅ No {orderId} in URL
     * POST /api/public/order-changes/substitution
     */
    @PostMapping("/substitution")
    public ResponseEntity<OrderDetailsDTO> substitution(@RequestBody PublicSubstitutionRequest req) {
        if (req == null || req.orderId == null || req.body == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.requestSubstitution(req.orderId, "system", req.body));
    }

    public static class PublicExtensionRequest {
        public Long orderId;
        public OrderExtensionRequest body;
    }

    public static class PublicSubstitutionRequest {
        public Long orderId;
        public OrderSubstitutionRequest body;
    }
}
