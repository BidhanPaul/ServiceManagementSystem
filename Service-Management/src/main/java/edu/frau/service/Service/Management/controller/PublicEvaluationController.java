package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.OfferEvaluationDTO;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.service.OfferEvaluationService;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicEvaluationController {

    private final OfferEvaluationService offerEvaluationService;
    private final RequestService requestService;

    public PublicEvaluationController(OfferEvaluationService offerEvaluationService,
                                      RequestService requestService) {
        this.offerEvaluationService = offerEvaluationService;
        this.requestService = requestService;
    }

    /**
     * ✅ Existing endpoint (kept):
     * GET /api/public/evaluations?requestId=123
     */
    @GetMapping("/evaluations")
    public ResponseEntity<List<OfferEvaluationDTO>> evaluations(@RequestParam Long requestId) {
        return ResponseEntity.ok(offerEvaluationService.getEvaluationsForRequest(requestId));
    }

    /**
     * ✅ NEW endpoint (NO ID REQUIRED):
     * GET /api/public/evaluations/all
     *
     * Returns evaluation rows for ALL requests.
     */
    @GetMapping("/evaluations/all")
    public ResponseEntity<List<OfferEvaluationDTO>> allEvaluations() {
        List<ServiceRequest> requests = requestService.getAllRequests();
        List<OfferEvaluationDTO> all = new ArrayList<>();

        for (ServiceRequest r : requests) {
            try {
                List<OfferEvaluationDTO> evals = offerEvaluationService.getEvaluationsForRequest(r.getId());
                if (evals != null) all.addAll(evals);
            } catch (Exception ignored) {
                // keep going
            }
        }

        return ResponseEntity.ok(all);
    }
}
