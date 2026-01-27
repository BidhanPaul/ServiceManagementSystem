package edu.frau.service.Service.Management.controller;


import edu.frau.service.Service.Management.dto.Group3ChangeDecisionDTO;
import edu.frau.service.Service.Management.dto.OrderDetailsDTO;
import edu.frau.service.Service.Management.service.ServiceOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/integrations/group4/orders")
public class Group4OrderChangeDecisionController {
    private final ServiceOrderService orderService;

    public Group4OrderChangeDecisionController(ServiceOrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/{orderId}/change/decision")
    public ResponseEntity<OrderDetailsDTO> decide(
            @PathVariable Long orderId,
            @RequestBody Group3ChangeDecisionDTO body
    ) {
        return ResponseEntity.ok(orderService.applyGroup4ChangeDecision(orderId, body));
    }

}
