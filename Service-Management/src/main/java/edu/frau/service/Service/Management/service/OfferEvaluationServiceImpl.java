package edu.frau.service.Service.Management.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.frau.service.Service.Management.dto.OfferEvaluationDTO;
import edu.frau.service.Service.Management.model.OfferEvaluation;
import edu.frau.service.Service.Management.model.ServiceOffer;
import edu.frau.service.Service.Management.model.ServiceRequest;
import edu.frau.service.Service.Management.repository.OfferEvaluationRepository;
import edu.frau.service.Service.Management.repository.ServiceOfferRepository;
import edu.frau.service.Service.Management.repository.ServiceRequestRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OfferEvaluationServiceImpl implements OfferEvaluationService {

    private static final String ALGO_VERSION = "v1.0";
    private static final double TECH_WEIGHT = 0.60;
    private static final double COMM_WEIGHT = 0.40;

    private final OfferEvaluationRepository evaluationRepository;
    private final ServiceRequestRepository requestRepository;
    private final ServiceOfferRepository offerRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OfferEvaluationServiceImpl(
            OfferEvaluationRepository evaluationRepository,
            ServiceRequestRepository requestRepository,
            ServiceOfferRepository offerRepository
    ) {
        this.evaluationRepository = evaluationRepository;
        this.requestRepository = requestRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    public List<OfferEvaluationDTO> getEvaluationsForRequest(Long requestId) {
        List<OfferEvaluation> rows = evaluationRepository.findByServiceRequestIdOrderByFinalScoreDesc(requestId);
        return toDtoWithRank(rows);
    }

    @Override
    public List<OfferEvaluationDTO> computeEvaluationsForRequest(Long requestId, String computedBy) {

        ServiceRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Load offers already in DB for that request
        List<ServiceOffer> offers = offerRepository.findByServiceRequestId(requestId);

        if (offers.isEmpty()) {
            // nothing to compute
            evaluationRepository.deleteByServiceRequestId(requestId);
            return List.of();
        }

        // remove old computations (keeps it clean for demos)
        evaluationRepository.deleteByServiceRequestId(requestId);

        // 1) compute eligibility + techScore first
        List<OfferEvaluation> evals = new ArrayList<>();
        for (ServiceOffer offer : offers) {
            OfferEvaluation row = new OfferEvaluation();
            row.setServiceRequest(req);
            row.setServiceOffer(offer);
            row.setComputedAt(Instant.now());
            row.setComputedBy(computedBy);
            row.setAlgorithmVersion(ALGO_VERSION);

            GateResult gate = gateOffer(offer);
            row.setEligible(gate.eligible);
            row.setDisqualificationReason(gate.reason);

            if (!gate.eligible) {
                row.setTechScore(0);
                row.setCommercialScore(0);
                row.setFinalScore(0);
                row.setBreakdownJson(toJson(Map.of(
                        "eligible", false,
                        "reason", gate.reason
                )));
                evals.add(row);
                continue;
            }

            TechResult tech = computeTech(offer);
            row.setTechScore(tech.techScore);
            row.setBreakdownJson(toJson(tech.breakdown));

            evals.add(row);
        }

        // 2) compute commercial score (needs min total cost among eligible)
        double minCost = evals.stream()
                .filter(OfferEvaluation::isEligible)
                .mapToDouble(e -> safeTotalCost(e.getServiceOffer()))
                .min()
                .orElse(0);

        for (OfferEvaluation e : evals) {
            if (!e.isEligible()) continue;

            double totalCost = safeTotalCost(e.getServiceOffer());
            double commercial = 0;

            if (minCost > 0 && totalCost > 0) {
                commercial = (minCost / totalCost) * 100.0;
                if (commercial > 100.0) commercial = 100.0;
            }

            e.setCommercialScore(round2(commercial));

            double finalScore = e.getTechScore() * TECH_WEIGHT + e.getCommercialScore() * COMM_WEIGHT;
            e.setFinalScore(round2(finalScore));
        }

        // 3) mark recommended = top finalScore (eligible only)
        Optional<OfferEvaluation> best = evals.stream()
                .filter(OfferEvaluation::isEligible)
                .max(Comparator.comparingDouble(OfferEvaluation::getFinalScore)
                        .thenComparingDouble(OfferEvaluation::getTechScore)
                        .thenComparingDouble(x -> -safeTotalCost(x.getServiceOffer())));

        best.ifPresent(b -> b.setRecommended(true));

        evaluationRepository.saveAll(evals);

        return toDtoWithRank(
                evaluationRepository.findByServiceRequestIdOrderByFinalScoreDesc(requestId)
        );
    }

    // ---------------- scoring helpers ----------------

    private static class GateResult {
        boolean eligible;
        String reason;
        GateResult(boolean eligible, String reason) { this.eligible = eligible; this.reason = reason; }
    }

    private GateResult gateOffer(ServiceOffer o) {
        if (!o.isMatchMustHaveCriteria()) return new GateResult(false, "Must-have criteria not matched");
        if (!o.isMatchLanguageSkills()) return new GateResult(false, "Language skills not matched");
        if (o.getDailyRate() <= 0) return new GateResult(false, "Daily rate is invalid");
        return new GateResult(true, null);
    }

    private static class TechResult {
        double techScore;
        Map<String, Object> breakdown;
        TechResult(double techScore, Map<String, Object> breakdown) {
            this.techScore = techScore;
            this.breakdown = breakdown;
        }
    }

    private TechResult computeTech(ServiceOffer o) {
        // Technical points
        int mustHave = o.isMatchMustHaveCriteria() ? 40 : 0;
        int language = o.isMatchLanguageSkills() ? 20 : 0;
        int nice = o.isMatchNiceToHaveCriteria() ? 10 : 0;

        int contractType = contractTypePoints(o.getContractualRelationship()); // max 10

        // For now: delivery neutral score (you can enrich later with provider delivery/deltas)
        int delivery = 20; // max 20 (enterprise-safe default)

        double tech = mustHave + language + nice + contractType + delivery; // max 100

        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put("mustHave", mustHave);
        breakdown.put("language", language);
        breakdown.put("niceToHave", nice);
        breakdown.put("contractType", contractType);
        breakdown.put("delivery", delivery);
        breakdown.put("note", "delivery/delta scoring is neutral until delivery fields are stored in DB");

        return new TechResult(round2(tech), breakdown);
    }

    private int contractTypePoints(String type) {
        if (type == null) return 6;
        String t = type.trim().toLowerCase();
        if (t.equals("employee")) return 10;
        if (t.equals("freelancer")) return 8;
        if (t.equals("subcontractor")) return 6;
        return 6;
    }

    private double safeTotalCost(ServiceOffer o) {
        if (o == null) return 0;
        double v = o.getTotalCost();
        if (v > 0) return v;
        // fallback (in case totalCost wasn't stored correctly)
        return Math.max(0, o.getDailyRate()) + Math.max(0, o.getTravellingCost());
    }

    private List<OfferEvaluationDTO> toDtoWithRank(List<OfferEvaluation> rows) {
        List<OfferEvaluationDTO> out = new ArrayList<>();
        int rank = 1;

        for (OfferEvaluation e : rows) {
            OfferEvaluationDTO dto = new OfferEvaluationDTO();
            ServiceOffer o = e.getServiceOffer();

            dto.offerId = o.getId();

            dto.eligible = e.isEligible();
            dto.disqualificationReason = e.getDisqualificationReason();

            dto.techScore = e.getTechScore();
            dto.commercialScore = e.getCommercialScore();
            dto.finalScore = e.getFinalScore();

            dto.breakdownJson = e.getBreakdownJson();

            dto.supplierName = o.getSupplierName();
            dto.specialistName = o.getSpecialistName();
            dto.contractualRelationship = o.getContractualRelationship();
            dto.subcontractorCompany = o.getSubcontractorCompany();
            dto.materialNumber = o.getMaterialNumber();

            dto.dailyRate = o.getDailyRate();
            dto.travellingCost = o.getTravellingCost();
            dto.totalCost = o.getTotalCost();

            dto.matchMustHaveCriteria = o.isMatchMustHaveCriteria();
            dto.matchNiceToHaveCriteria = o.isMatchNiceToHaveCriteria();
            dto.matchLanguageSkills = o.isMatchLanguageSkills();

            dto.recommended = e.isRecommended();

            // rank only among eligible offers (enterprise-like)
            if (e.isEligible()) {
                dto.rank = rank++;
            } else {
                dto.rank = 0;
            }

            out.add(dto);
        }

        return out;
    }

    private String toJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
