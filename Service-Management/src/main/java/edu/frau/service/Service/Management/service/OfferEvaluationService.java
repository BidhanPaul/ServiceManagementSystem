package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.dto.OfferEvaluationDTO;

import java.util.List;

public interface OfferEvaluationService {

    List<OfferEvaluationDTO> getEvaluationsForRequest(Long requestId);

    List<OfferEvaluationDTO> computeEvaluationsForRequest(Long requestId, String computedBy);
}
