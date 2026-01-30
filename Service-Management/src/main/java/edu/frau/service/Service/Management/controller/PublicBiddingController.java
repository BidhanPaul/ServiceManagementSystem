package edu.frau.service.Service.Management.controller;

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
     * ✅ Existing endpoint (kept)
     * POST /api/public/bids
     * Accepts: { requestId, offer: { id, ... } }
     */
    @PostMapping("/bids")
    public ResponseEntity<ServiceOffer> bid(@RequestBody PublicBidRequest body) {

        if (body == null || body.requestId == null || body.offer == null) {
            return ResponseEntity.badRequest().body(null);
        }

        // provider must send their offer id as offer.id
        if (body.offer.id == null) {
            return ResponseEntity.badRequest().body(null);
        }

        ServiceOffer offer = new ServiceOffer();
        offer.setId(null); // force INSERT
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

        // ✅ specialists[] support (if you added it in ServiceOffer)
        if (body.offer.specialists != null && !body.offer.specialists.isEmpty()) {
            for (PublicSpecialistDTO s : body.offer.specialists) {
                if (s == null) continue;

                ServiceOfferSpecialist child = new ServiceOfferSpecialist();
                child.setUserId(s.userId);
                child.setName(s.name);
                child.setMaterialNumber(s.materialNumber);

                child.setDailyRate(s.dailyRate != null ? s.dailyRate : 0.0);
                child.setTravellingCost(s.travellingCost != null ? s.travellingCost : 0.0);
                child.setSpecialistCost(s.specialistCost != null ? s.specialistCost : 0.0);

                child.setMatchMustHaveCriteria(Boolean.TRUE.equals(s.matchMustHaveCriteria));
                child.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(s.matchNiceToHaveCriteria));
                child.setMatchLanguageSkills(Boolean.TRUE.equals(s.matchLanguageSkills));

                offer.addSpecialist(child); // requires offer.addSpecialist(...)
            }
        }

        ServiceOffer created = requestService.addOffer(body.requestId, offer);
        return ResponseEntity.ok(created);
    }

    /**
     * ✅ NEW endpoint: accepts EXACT provider payload
     * POST /api/public/provider-bids
     *
     * Accepts:
     * {
     *   "id": 3,
     *   "serviceRequest": { "id": 39, ... },
     *   "specialists": [ ... ],
     *   "totalCost": 87300,
     *   ...
     * }
     */
    @PostMapping("/provider-bids")
    public ResponseEntity<ServiceOffer> providerBid(@RequestBody ProviderBidPayload body) {

        if (body == null) return ResponseEntity.badRequest().body(null);

        // ✅ requestId comes from serviceRequest.id
        if (body.serviceRequest == null || body.serviceRequest.id == null) {
            return ResponseEntity.badRequest().body(null);
        }

        // ✅ provider offer id comes from root "id"
        if (body.id == null) {
            return ResponseEntity.badRequest().body(null);
        }

        Long requestId = body.serviceRequest.id;

        ServiceOffer offer = new ServiceOffer();
        offer.setId(null); // force INSERT
        offer.setProviderOfferId(body.id); // ✅ map root id -> providerOfferId

        // for multi/team: keep a label in specialistName/materialNumber if you want
        offer.setSpecialistName("MULTI_SPECIALISTS"); // or first specialist name if SINGLE
        offer.setMaterialNumber("MULTI");

        offer.setTotalCost(body.totalCost != null ? body.totalCost : 0.0);

        offer.setContractualRelationship(body.contractualRelationship);
        offer.setSubcontractorCompany(body.subcontractorCompany);

        offer.setSupplierName(body.supplierName);
        offer.setSupplierRepresentative(body.supplierRepresentative);

        // ✅ optional: if provider sends offerStatus/providerId/providerName, you can store them
        // (only if you added fields in ServiceOffer. If not, ignore)

        // ✅ specialists[]
        if (body.specialists != null && !body.specialists.isEmpty()) {
            for (ProviderSpecialistDTO s : body.specialists) {
                if (s == null) continue;

                ServiceOfferSpecialist child = new ServiceOfferSpecialist();
                child.setUserId(s.userId);
                child.setName(s.name);
                child.setMaterialNumber(s.materialNumber);

                child.setDailyRate(s.dailyRate != null ? s.dailyRate : 0.0);
                child.setTravellingCost(s.travellingCost != null ? s.travellingCost : 0.0);
                child.setSpecialistCost(s.specialistCost != null ? s.specialistCost : 0.0);

                child.setMatchMustHaveCriteria(Boolean.TRUE.equals(s.matchMustHaveCriteria));
                child.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(s.matchNiceToHaveCriteria));
                child.setMatchLanguageSkills(Boolean.TRUE.equals(s.matchLanguageSkills));

                offer.addSpecialist(child);
            }

            // ✅ if SINGLE, you may want the card title to be first specialist name
            if (body.specialists.size() == 1 && body.specialists.get(0) != null) {
                offer.setSpecialistName(body.specialists.get(0).name);
                offer.setMaterialNumber(body.specialists.get(0).materialNumber);
                offer.setDailyRate(body.specialists.get(0).dailyRate != null ? body.specialists.get(0).dailyRate : 0.0);
                offer.setTravellingCost(body.specialists.get(0).travellingCost != null ? body.specialists.get(0).travellingCost : 0.0);
            }
        }

        // ✅ matching flags at offer-level (optional default)
        offer.setMatchMustHaveCriteria(true);
        offer.setMatchNiceToHaveCriteria(true);
        offer.setMatchLanguageSkills(true);

        ServiceOffer created = requestService.addOffer(requestId, offer);
        return ResponseEntity.ok(created);
    }

    // ---------------- DTOs ----------------

    public static class PublicBidRequest {
        public Long requestId;
        public PublicOfferDTO offer;
    }

    public static class PublicOfferDTO {
        public Long id; // provider offer id
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

        // ✅ NEW: support specialists array
        public java.util.List<PublicSpecialistDTO> specialists;
    }

    public static class PublicSpecialistDTO {
        public String userId;
        public String name;
        public String materialNumber;
        public Double dailyRate;
        public Double travellingCost;
        public Double specialistCost;
        public Boolean matchMustHaveCriteria;
        public Boolean matchNiceToHaveCriteria;
        public Boolean matchLanguageSkills;
    }

    // ✅ Provider exact payload DTO
    public static class ProviderBidPayload {
        public Long id; // provider offer id at root
        public ProviderServiceRequestRef serviceRequest;
        public java.util.List<ProviderSpecialistDTO> specialists;

        public Double totalCost;
        public String contractualRelationship;
        public String subcontractorCompany;

        public String supplierName;
        public String supplierRepresentative;

        public String offerStatus;
        public String providerId;
        public String providerName;
    }

    public static class ProviderServiceRequestRef {
        public Long id;
        public String requestNumber;
    }

    public static class ProviderSpecialistDTO {
        public String userId;
        public String name;
        public String materialNumber;
        public Double dailyRate;
        public Double travellingCost;
        public Double specialistCost;
        public Boolean matchMustHaveCriteria;
        public Boolean matchNiceToHaveCriteria;
        public Boolean matchLanguageSkills;
    }
}
