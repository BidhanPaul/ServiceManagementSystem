package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.ServiceOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceOfferRepository extends JpaRepository<ServiceOffer, Long> {
    List<ServiceOffer> findByServiceRequestId(Long serviceRequestId);
}
