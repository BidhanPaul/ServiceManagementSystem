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
     * ✅ Public bid endpoint
     * POST /api/public/bids
     *
     * Provider payload includes offer.id (provider's offer id).
     * We store that into ServiceOffer.providerOfferId so APPROVE/REJECT can notify Group3 later.
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

        // ✅ Build a brand-new entity (IGNORE any incoming internal id / nested objects)
        ServiceOffer offer = new ServiceOffer();
        offer.setId(null); // force INSERT (internal DB id)
        offer.setProviderOfferId(body.offer.id); // ✅ save provider's offer id

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

        // ✅ Save offer for the request
        ServiceOffer created = requestService.addOffer(body.requestId, offer);
        return ResponseEntity.ok(created);
    }

    // ---------------- DTOs ----------------

    public static class PublicBidRequest {
        public Long requestId;
        public PublicOfferDTO offer;
    }

    public static class PublicOfferDTO {
        /**
         * ✅ Provider system offer id.
         * Provider sends this as offer.id in payload.
         */
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
