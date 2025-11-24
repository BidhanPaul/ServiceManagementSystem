// src/main/java/edu/frau/service/Service/Management/controller/ServiceOfferController.java
package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.RequestStatus;
import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/offers")
public class ServiceOfferController {

    @Autowired
    private ServiceOfferRepository offerRepository;

    @PutMapping("/{offerId}")
    public ResponseEntity<ServiceOffer> updateOffer(
            @PathVariable Long offerId,
            @RequestBody ServiceOffer updated
    ) {
        ServiceOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        ServiceRequest req = offer.getServiceRequest();
        if (req.getStatus() != RequestStatus.DRAFT) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        // Copy editable fields
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

        ServiceRequest req = offer.getServiceRequest();
        if (req.getStatus() != RequestStatus.DRAFT) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        offerRepository.delete(offer);
        return ResponseEntity.noContent().build();
    }
}
