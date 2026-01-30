package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.ServiceOfferSpecialist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceOfferSpecialistRepository extends JpaRepository<ServiceOfferSpecialist, Long> {
    List<ServiceOfferSpecialist> findByServiceOfferId(Long serviceOfferId);
}
