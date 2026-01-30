package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.ProviderBidPayloadDTO;
import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceOfferSpecialist;
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
     * ✅ Legacy public bid endpoint (kept)
     * POST /api/public/bids
     *
     * Provider payload includes offer.id (provider's offer id).
     * We store that into ServiceOffer.providerOfferId so APPROVE/REJECT can notify later.
     */
    @PostMapping("/bids")
    public ResponseEntity<ServiceOffer> bid(@RequestBody PublicBidRequest body) {

        if (body == null || body.requestId == null || body.offer == null) {
            return ResponseEntity.badRequest().body(null);
        }

        // ✅ Provider must send their offer id as offer.id
        if (body.offer.id == null) {
            return ResponseEntity.badRequest().body(null);
        }

        ServiceOffer offer = new ServiceOffer();
        offer.setId(null);
        offer.setProviderOfferId(body.offer.id);

        offer.setSpecialistName(body.offer.specialistName);
        offer.setMaterialNumber(body.offer.materialNumber);

        offer.setDailyRate(body.offer.dailyRate != null ? body.offer.dailyRate : 0.0);
        offer.setTravellingCost(body.offer.travellingCost != null ? body.offer.travellingCost : 0.0);
        offer.setTotalCost(body.offer.totalCost != null ? body.offer.totalCost : 0.0);

        offer.setContractualRelationship(body.offer.contractualRelationship);
        offer.setSubcontractorCompany(body.offer.subcontractorCompany);

        offer.setMatchMustHaveCriteria(Boolean.TRUE.equals(body.offer.matchMustHaveCriteria));
        offer.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(body.offer.matchNiceToHaveCriteria));
        offer.setMatchLanguageSkills(Boolean.TRUE.equals(body.offer.matchLanguageSkills));

        offer.setSupplierName(body.offer.supplierName);
        offer.setSupplierRepresentative(body.offer.supplierRepresentative);

        ServiceOffer created = requestService.addOffer(body.requestId, offer);
        return ResponseEntity.ok(created);
    }

    /**
     * ✅ NEW: Accept provider payload EXACTLY like sample
     * POST /api/public/provider-bids?requestId=39
     *
     * Provider sends:
     * {
     *   "id": 3,
     *   "serviceRequest": {...},
     *   "specialists":[...],
     *   "totalCost":...,
     *   ...
     * }
     *
     * We store:
     * - providerOfferId = payload.id
     * - specialists[] as children rows
     * - backward-compatible fields copied from first specialist (so your UI/old logic still works)
     */
    @PostMapping("/provider-bids")
    public ResponseEntity<ServiceOffer> providerBid(
            @RequestParam("requestId") Long requestId,
            @RequestBody ProviderBidPayloadDTO payload
    ) {
        if (requestId == null || payload == null || payload.id == null) {
            return ResponseEntity.badRequest().body(null);
        }

        ServiceOffer offer = new ServiceOffer();
        offer.setId(null);
        offer.setProviderOfferId(payload.id);

        offer.setSupplierName(payload.supplierName);
        offer.setSupplierRepresentative(payload.supplierRepresentative);

        offer.setContractualRelationship(payload.contractualRelationship);
        offer.setSubcontractorCompany(payload.subcontractorCompany);

        // totalCost at header level
        offer.setTotalCost(payload.totalCost != null ? payload.totalCost : 0.0);

        // specialists[] -> persist children
        if (payload.specialists != null && !payload.specialists.isEmpty()) {
            for (ProviderBidPayloadDTO.SpecialistDTO s : payload.specialists) {
                if (s == null) continue;

                ServiceOfferSpecialist child = new ServiceOfferSpecialist();
                child.setUserId(s.userId);
                child.setName(s.name);
                child.setMaterialNumber(s.materialNumber);

                child.setDailyRate(s.dailyRate);
                child.setTravellingCost(s.travellingCost);
                child.setSpecialistCost(s.specialistCost);

                child.setMatchMustHaveCriteria(s.matchMustHaveCriteria);
                child.setMatchNiceToHaveCriteria(s.matchNiceToHaveCriteria);
                child.setMatchLanguageSkills(s.matchLanguageSkills);

                offer.addSpecialist(child);
            }

            // ✅ Backward compatible fields from first specialist
            ProviderBidPayloadDTO.SpecialistDTO first = payload.specialists.get(0);
            offer.setSpecialistName(first.name);
            offer.setMaterialNumber(first.materialNumber);
            offer.setDailyRate(first.dailyRate != null ? first.dailyRate : 0.0);
            offer.setTravellingCost(first.travellingCost != null ? first.travellingCost : 0.0);

            offer.setMatchMustHaveCriteria(Boolean.TRUE.equals(first.matchMustHaveCriteria));
            offer.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(first.matchNiceToHaveCriteria));
            offer.setMatchLanguageSkills(Boolean.TRUE.equals(first.matchLanguageSkills));
        }

        ServiceOffer created = requestService.addOffer(requestId, offer);
        return ResponseEntity.ok(created);
    }

    // ---------------- Legacy DTOs (kept) ----------------

    public static class PublicBidRequest {
        public Long requestId;
        public PublicOfferDTO offer;
    }

    public static class PublicOfferDTO {
        public Long id;

        public String specialistName;
        public String materialNumber;

        public Double dailyRate;
        public Double travellingCost;
        public Double totalCost;

        public String contractualRelationship;
        public String subcontractorCompany;

        public Boolean matchMustHaveCriteria;
        public Boolean matchNiceToHaveCriteria;
        public Boolean matchLanguageSkills;

        public String supplierName;
        public String supplierRepresentative;
    }
}
