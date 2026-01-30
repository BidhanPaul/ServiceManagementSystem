package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceOfferSpecialist;
import edu.frau.service.Service.Management.service.RequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicBiddingController {

    private final RequestService requestService;

    public PublicBiddingController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * ✅ ONE SIMPLE ENDPOINT FOR ALL PROVIDER BIDS
     *
     * POST /api/public/bids
     *
     * Supports:
     * - single request (serviceRequest)
     * - multi request (serviceRequests[])
     * - flat specialists (specialists[])
     * - team allocations (allocations[])
     *
     * Always returns:
     * - List<ServiceOffer> (size = 1 for single request)
     */
    @PostMapping("/bids")
    public ResponseEntity<List<ServiceOffer>> bidFromProviderUnified(
            @RequestBody ProviderBidPayload body) {

        if (body == null || body.id == null) {
            return ResponseEntity.badRequest().body(null);
        }

        boolean hasSingle = body.serviceRequest != null && body.serviceRequest.id != null;
        boolean hasMulti = body.serviceRequests != null && !body.serviceRequests.isEmpty();

        // must be exactly one mode
        if (hasSingle == hasMulti) {
            return ResponseEntity.badRequest().body(null);
        }

        // collect request ids
        List<Long> requestIds = new ArrayList<>();
        if (hasSingle) {
            requestIds.add(body.serviceRequest.id);
        } else {
            for (ProviderServiceRequest sr : body.serviceRequests) {
                if (sr == null || sr.id == null) {
                    return ResponseEntity.badRequest().body(null);
                }
                requestIds.add(sr.id);
            }
        }

        List<ServiceOffer> createdOffers = new ArrayList<>();

        for (Long requestId : requestIds) {

            ServiceOffer offer = buildBaseOffer(body);

            // prefer allocations (team), fallback to specialists
            if (body.allocations != null && !body.allocations.isEmpty()) {
                applyAllocations(offer, body.allocations, requestId);
            } else {
                applySpecialists(offer, body.specialists);
            }

            ServiceOffer created = requestService.addOffer(requestId, offer);
            createdOffers.add(created);
        }

        return ResponseEntity.ok(createdOffers);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private ServiceOffer buildBaseOffer(ProviderBidPayload body) {
        ServiceOffer offer = new ServiceOffer();
        offer.setId(null); // always INSERT
        offer.setProviderOfferId(body.id);

        offer.setSupplierName(body.supplierName);
        offer.setSupplierRepresentative(body.supplierRepresentative);

        offer.setContractualRelationship(body.contractualRelationship);
        offer.setSubcontractorCompany(body.subcontractorCompany);

        offer.setTotalCost(body.totalCost != null ? body.totalCost : 0.0);
        return offer;
    }

    private void applySpecialists(ServiceOffer offer, List<ProviderSpecialist> specialists) {

        if (specialists == null || specialists.isEmpty()) {
            offer.setMatchMustHaveCriteria(false);
            offer.setMatchNiceToHaveCriteria(false);
            offer.setMatchLanguageSkills(false);
            return;
        }

        ProviderSpecialist first = specialists.get(0);
        offer.setSpecialistName(first.name);
        offer.setMaterialNumber(first.materialNumber);
        offer.setDailyRate(first.dailyRate != null ? first.dailyRate : 0.0);
        offer.setTravellingCost(first.travellingCost != null ? first.travellingCost : 0.0);

        boolean must = true, nice = true, lang = true;

        for (ProviderSpecialist s : specialists) {
            ServiceOfferSpecialist child = new ServiceOfferSpecialist();
            child.setUserId(s.userId);
            child.setName(s.name);
            child.setMaterialNumber(s.materialNumber);
            child.setDailyRate(s.dailyRate);
            child.setTravellingCost(s.travellingCost);
            child.setSpecialistCost(s.specialistCost);

            child.setMatchMustHaveCriteria(Boolean.TRUE.equals(s.matchMustHaveCriteria));
            child.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(s.matchNiceToHaveCriteria));
            child.setMatchLanguageSkills(Boolean.TRUE.equals(s.matchLanguageSkills));

            must &= Boolean.TRUE.equals(s.matchMustHaveCriteria);
            nice &= Boolean.TRUE.equals(s.matchNiceToHaveCriteria);
            lang &= Boolean.TRUE.equals(s.matchLanguageSkills);

            offer.addSpecialist(child);
        }

        offer.setMatchMustHaveCriteria(must);
        offer.setMatchNiceToHaveCriteria(nice);
        offer.setMatchLanguageSkills(lang);
    }

    private void applyAllocations(ServiceOffer offer,
                                  List<RoleAllocation> allocations,
                                  Long requestId) {

        boolean must = true, nice = true, lang = true;
        boolean legacySet = false;

        for (RoleAllocation a : allocations) {

            // filter by request in multi mode
            if (a.serviceRequest != null && a.serviceRequest.id != null &&
                    !requestId.equals(a.serviceRequest.id)) {
                continue;
            }

            if (a.members == null) continue;

            for (SpecialistAllocation s : a.members) {

                if (!legacySet) {
                    offer.setSpecialistName(s.name);
                    offer.setMaterialNumber(s.materialNumber);
                    offer.setDailyRate(s.dailyRate != null ? s.dailyRate : 0.0);
                    offer.setTravellingCost(s.travellingCost != null ? s.travellingCost : 0.0);
                    legacySet = true;
                }

                ServiceOfferSpecialist child = new ServiceOfferSpecialist();
                child.setUserId(s.userId);
                child.setName(s.name);
                child.setMaterialNumber(s.materialNumber);
                child.setDailyRate(s.dailyRate);
                child.setTravellingCost(s.travellingCost);
                child.setSpecialistCost(s.specialistCost);

                child.setMatchMustHaveCriteria(Boolean.TRUE.equals(s.matchMustHaveCriteria));
                child.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(s.matchNiceToHaveCriteria));
                child.setMatchLanguageSkills(Boolean.TRUE.equals(s.matchLanguageSkills));

                must &= Boolean.TRUE.equals(s.matchMustHaveCriteria);
                nice &= Boolean.TRUE.equals(s.matchNiceToHaveCriteria);
                lang &= Boolean.TRUE.equals(s.matchLanguageSkills);

                offer.addSpecialist(child);
            }
        }

        offer.setMatchMustHaveCriteria(must);
        offer.setMatchNiceToHaveCriteria(nice);
        offer.setMatchLanguageSkills(lang);
    }

    // ---------------------------------------------------------------------
    // DTOs
    // ---------------------------------------------------------------------

    public static class ProviderBidPayload {
        public Long id;

        public ProviderServiceRequest serviceRequest;
        public List<ProviderServiceRequest> serviceRequests;

        public List<ProviderSpecialist> specialists;
        public List<RoleAllocation> allocations;

        public Double totalCost;
        public String contractualRelationship;
        public String subcontractorCompany;
        public String supplierName;
        public String supplierRepresentative;
        public String offerStatus;
        public String providerId;
        public String providerName;
    }

    public static class ProviderServiceRequest {
        public Long id;
        public String requestNumber;
        public String title;
        public String type;
    }

    public static class ProviderSpecialist {
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

    public static class RoleAllocation {
        public ProviderServiceRequest serviceRequest;
        public String domain;
        public String roleName;
        public String technology;
        public String experienceLevel;
        public Integer manDays;
        public Integer onsiteDays;
        public List<SpecialistAllocation> members;
        public Double roleTotalCost;
    }

    public static class SpecialistAllocation extends ProviderSpecialist {
        public Integer manDaysAssigned;
        public Integer onsiteDaysAssigned;
    }
}
