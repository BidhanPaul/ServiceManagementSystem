package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.dto.CreateOfferRequest;
import edu.frau.service.Service.Management.model.RequestStatus;
import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/offers")
public class ServiceOfferController {

    private final ServiceOfferRepository offerRepository;
    private final ServiceRequestRepository requestRepository;

    public ServiceOfferController(ServiceOfferRepository offerRepository,
                                  ServiceRequestRepository requestRepository) {
        this.offerRepository = offerRepository;
        this.requestRepository = requestRepository;
    }

    // ✅ CREATE offer (used by provider team during bidding)
    @PostMapping
    public ResponseEntity<ServiceOffer> createOffer(@RequestBody CreateOfferRequest req) {

        if (req.serviceRequestId == null) {
            throw new IllegalArgumentException("serviceRequestId is required");
        }
        if (req.providerOfferId == null) {
            throw new IllegalArgumentException("providerOfferId is required");
        }

        ServiceRequest sr = requestRepository.findById(req.serviceRequestId)
                .orElseThrow(() -> new IllegalArgumentException("ServiceRequest not found"));

        // Optional rule: only allow during BIDDING
        if (sr.getStatus() != RequestStatus.BIDDING && sr.getStatus() != RequestStatus.DRAFT) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        ServiceOffer offer = new ServiceOffer();
        offer.setServiceRequest(sr);

        // ✅ THIS is the key piece
        offer.setProviderOfferId(req.providerOfferId);

        offer.setSpecialistName(req.specialistName);
        offer.setMaterialNumber(req.materialNumber);
        offer.setDailyRate(req.dailyRate);
        offer.setTravellingCost(req.travellingCost);
        offer.setTotalCost(req.totalCost);

        offer.setMatchMustHaveCriteria(Boolean.TRUE.equals(req.matchMustHaveCriteria));
        offer.setMatchNiceToHaveCriteria(Boolean.TRUE.equals(req.matchNiceToHaveCriteria));
        offer.setMatchLanguageSkills(Boolean.TRUE.equals(req.matchLanguageSkills));

        offer.setContractualRelationship(req.contractualRelationship);
        offer.setSubcontractorCompany(req.subcontractorCompany);

        offer.setSupplierName(req.supplierName);
        offer.setSupplierRepresentative(req.supplierRepresentative);

        ServiceOffer saved = offerRepository.save(offer);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{offerId}")
    public ResponseEntity<ServiceOffer> updateOffer(
            @PathVariable Long offerId,
            @RequestBody ServiceOffer updated
    ) {
        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        ServiceRequest sr = offer.getServiceRequest();
        if (sr.getStatus() != RequestStatus.DRAFT && sr.getStatus() != RequestStatus.BIDDING) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        // keep providerOfferId if provided
        if (updated.getProviderOfferId() != null) {
            offer.setProviderOfferId(updated.getProviderOfferId());
        }

        offer.setSpecialistName(updated.getSpecialistName());
        offer.setSupplierName(updated.getSupplierName());
        offer.setContractualRelationship(updated.getContractualRelationship());
        offer.setDailyRate(updated.getDailyRate());
        offer.setTotalCost(updated.getTotalCost());

        ServiceOffer saved = offerRepository.save(offer);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{offerId}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long offerId) {
        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        ServiceRequest sr = offer.getServiceRequest();
        if (sr.getStatus() != RequestStatus.DRAFT && sr.getStatus() != RequestStatus.BIDDING) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        offerRepository.delete(offer);
        return ResponseEntity.noContent().build();
    }
}
