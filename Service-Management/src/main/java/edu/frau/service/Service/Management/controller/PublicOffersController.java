package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicOffersController {

    private final RequestService requestService;

    public PublicOffersController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * ✅ Public offers list for reporting
     * GET /api/public/offers?requestId=123
     */
    @GetMapping("/offers")
    public ResponseEntity<List<ServiceOffer>> offers(@RequestParam Long requestId) {
        return ResponseEntity.ok(requestService.getOffersForRequest(requestId));
    }
}
