package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.OfferEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OfferEvaluationRepository extends JpaRepository<OfferEvaluation, Long> {

    List<OfferEvaluation> findByServiceRequestIdOrderByFinalScoreDesc(Long requestId);

    Optional<OfferEvaluation> findByServiceOfferId(Long offerId);

    void deleteByServiceRequestId(Long requestId);
}
