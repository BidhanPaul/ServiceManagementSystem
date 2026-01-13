package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.RequestStatus;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class BiddingCycleScheduler {

    private final ServiceRequestRepository requestRepository;
    private final ServiceOfferRepository offerRepository;

    public BiddingCycleScheduler(ServiceRequestRepository requestRepository,
                                 ServiceOfferRepository offerRepository) {
        this.requestRepository = requestRepository;
        this.offerRepository = offerRepository;
    }

    // ✅ run frequently so "0 cycle demo" expires quickly
    @Scheduled(fixedRate = 2_000) // every 2 seconds (demo-friendly)
    public void expireRequestsIfNoOffers() {

        Instant now = Instant.now();

        List<ServiceRequest> expiredCandidates =
                requestRepository.findByBiddingActiveTrueAndBiddingEndAtBefore(now);

        for (ServiceRequest req : expiredCandidates) {
            boolean hasOffers = offerRepository.existsByServiceRequestId(req.getId());

            req.setBiddingActive(false);

            if (!hasOffers) {
                req.setStatus(RequestStatus.EXPIRED);
            }

            requestRepository.save(req);

            System.out.println("[BiddingScheduler] Expired request " + req.getId() +
                    " | offers=" + hasOffers +
                    " | status=" + req.getStatus());
        }
    }
}
