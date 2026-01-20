package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicOffersController {

    private final RequestService requestService;

    public PublicOffersController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * ✅ Existing endpoint (kept):
     * GET /api/public/offers?requestId=123
     */
    @GetMapping("/offers")
    public ResponseEntity<List<ServiceOffer>> offers(@RequestParam Long requestId) {
        return ResponseEntity.ok(requestService.getOffersForRequest(requestId));
    }

    /**
     * ✅ NEW endpoint (NO ID REQUIRED):
     * GET /api/public/offers/all
     *
     * Returns offers for ALL requests.
     */
    @GetMapping("/offers/all")
    public ResponseEntity<List<ServiceOffer>> allOffers() {
        List<ServiceRequest> requests = requestService.getAllRequests();
        List<ServiceOffer> all = new ArrayList<>();

        for (ServiceRequest r : requests) {
            try {
                List<ServiceOffer> offers = requestService.getOffersForRequest(r.getId());
                if (offers != null) all.addAll(offers);
            } catch (Exception ignored) {
                // keep going
            }
        }

        return ResponseEntity.ok(all);
    }
}
