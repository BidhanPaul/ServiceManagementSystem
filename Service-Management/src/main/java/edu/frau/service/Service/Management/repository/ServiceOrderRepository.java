package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.ServiceOrder;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {
    List<ServiceOrder> findBySupplierName(String supplierName);
    @Modifying
    @Transactional
    @Query("delete from ServiceOrder so where so.serviceRequestReference.id = :requestId")
    void deleteByServiceRequestId(Long requestId);
}
