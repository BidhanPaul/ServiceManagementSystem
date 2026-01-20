package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicBiddingController {

    private final RequestService requestService;

    public PublicBiddingController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * ✅ Public bid endpoint (no {id} in URL)
     * POST /api/public/bids
     */
    @PostMapping("/bids")
    public ResponseEntity<ServiceOffer> bid(@RequestBody PublicBidRequest body) {
        if (body == null || body.requestId == null || body.offer == null) {
            return ResponseEntity.badRequest().build();
        }
        ServiceOffer created = requestService.addOffer(body.requestId, body.offer);
        return ResponseEntity.ok(created);
    }

    public static class PublicBidRequest {
        public Long requestId;
        public ServiceOffer offer;
    }
}
