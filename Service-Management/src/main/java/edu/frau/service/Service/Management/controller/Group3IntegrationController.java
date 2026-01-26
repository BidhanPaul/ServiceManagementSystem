package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.Group3OfferDecisionDTO;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/integrations/group3")
public class Group3IntegrationController {

    private final RequestService requestService;

    public Group3IntegrationController(RequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping("/offers/{offerId}/decision")
    public ResponseEntity<String> offerDecision(
            @PathVariable Long offerId,
            @RequestBody Group3OfferDecisionDTO body
    ) {
        requestService.applyProviderDecisionFromGroup3(offerId, body);
        return ResponseEntity.ok("OK");
    }
}
