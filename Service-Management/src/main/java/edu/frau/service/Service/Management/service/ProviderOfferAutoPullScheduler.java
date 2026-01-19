package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class ProviderOfferAutoPullScheduler {

    private final ServiceRequestRepository requestRepository;
    private final RequestService requestService;

    public ProviderOfferAutoPullScheduler(ServiceRequestRepository requestRepository,
                                          RequestService requestService) {
        this.requestRepository = requestRepository;
        this.requestService = requestService;
    }

    /**
     * ✅ Enterprise-style behavior:
     * When bidding cycle ends, automatically pull provider bids once.
     *
     * IMPORTANT:
     * - We DO NOT change request status here
     * - We DO NOT expire here
     * - Manual pull still works anytime via endpoint
     */
    @Scheduled(fixedRate = 2_000) // demo-friendly; you can change later
    public void autoPullWhenCycleEnds() {

        Instant now = Instant.now();

        List<ServiceRequest> ended =
                requestRepository.findByBiddingActiveTrueAndBiddingEndAtBefore(now);

        for (ServiceRequest req : ended) {
            try {
                requestService.pullProviderOffers(req.getId());
                System.out.println("[AutoPullScheduler] Auto-pulled offers for request "
                        + req.getId() + " (" + req.getRequestNumber() + ")");
            } catch (Exception e) {
                // Never crash scheduler
                System.out.println("[AutoPullScheduler] Failed for request " + req.getId()
                        + " -> " + e.getMessage());
            }
        }
    }
}
