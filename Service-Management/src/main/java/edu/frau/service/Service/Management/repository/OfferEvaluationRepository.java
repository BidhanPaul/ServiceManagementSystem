package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.OfferEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface OfferEvaluationRepository extends JpaRepository<OfferEvaluation, Long> {

    List<OfferEvaluation> findByServiceRequestIdOrderByFinalScoreDesc(Long requestId);

    Optional<OfferEvaluation> findByServiceOfferId(Long offerId);

    void deleteByServiceRequestId(Long requestId);

    // ✅ NEW: row-level lock for concurrency safety (prevents duplicate insert)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from OfferEvaluation e where e.serviceOffer.id = :offerId")
    Optional<OfferEvaluation> findWithLockByServiceOfferId(@Param("offerId") Long offerId);
}
