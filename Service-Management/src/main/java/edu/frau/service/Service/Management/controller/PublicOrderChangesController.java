package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.OrderDetailsDTO;
import edu.frau.service.Service.Management.dto.OrderExtensionRequest;
import edu.frau.service.Service.Management.dto.OrderSubstitutionRequest;
import edu.frau.service.Service.Management.service.ServiceOrderService;
import org.springframework.http.MediaType;
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
     * ✅ Group3 payload:
     * POST /api/public/order-changes/extension
     * {
     *   "orderId": 9,
     *   "body": {
     *     "newEndDate": "2025-10-29",
     *     "newManDays": 10,
     *     "newContractValue": 9999.99,
     *     "comment": "..."
     *   }
     * }
     */
    @PostMapping(
            value = "/extension",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<OrderDetailsDTO> extension(@RequestBody PublicExtensionRequest req) {
        if (req == null || req.orderId == null || req.body == null) {
            return ResponseEntity.badRequest().build();
        }

        // ✅ Minimal validation to prevent hidden 500 errors
        if (req.body.newEndDate == null) {
            return ResponseEntity.badRequest().build();
        }
        if (req.body.newManDays == null || req.body.newManDays <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (req.body.newContractValue == null) {
            return ResponseEntity.badRequest().build();
        }
        if (req.body.comment == null) {
            req.body.comment = "";
        }

        // ✅ Keep your existing service call logic (unchanged)
        return ResponseEntity.ok(orderService.requestExtension(req.orderId, "system", req.body));
    }

    /**
     * ✅ Group3 payload:
     * POST /api/public/order-changes/substitution
     * {
     *   "orderId": 10,
     *   "body": {
     *     "substitutionDate": "2026-02-01",
     *     "comment": "need new specialist"
     *   }
     * }
     */
    @PostMapping(
            value = "/substitution",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<OrderDetailsDTO> substitution(@RequestBody PublicSubstitutionRequest req) {
        if (req == null || req.orderId == null || req.body == null) {
            return ResponseEntity.badRequest().build();
        }

        // ✅ Minimal validation to prevent hidden 500 errors
        if (req.body.substitutionDate == null) {
            return ResponseEntity.badRequest().build();
        }
        if (req.body.comment == null) {
            req.body.comment = "";
        }

        // ✅ Keep your existing service call logic (unchanged)
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
