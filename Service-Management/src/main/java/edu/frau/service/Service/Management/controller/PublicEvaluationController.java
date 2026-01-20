package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.OfferEvaluationDTO;
import edu.frau.service.Service.Management.service.OfferEvaluationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicEvaluationController {

    private final OfferEvaluationService offerEvaluationService;

    public PublicEvaluationController(OfferEvaluationService offerEvaluationService) {
        this.offerEvaluationService = offerEvaluationService;
    }

    /**
     * ✅ Public evaluation/score list for reporting
     * GET /api/public/evaluations?requestId=123
     */
    @GetMapping("/evaluations")
    public ResponseEntity<List<OfferEvaluationDTO>> evaluations(@RequestParam Long requestId) {
        return ResponseEntity.ok(offerEvaluationService.getEvaluationsForRequest(requestId));
    }
}
