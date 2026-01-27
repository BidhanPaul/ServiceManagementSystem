package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.OrderStatus;
import edu.frau.service.Service.Management.model.ServiceOrder;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {

    List<ServiceOrder> findBySupplierName(String supplierName);

    // ✅ list orders for a request
    List<ServiceOrder> findByServiceRequestReferenceIdOrderByIdDesc(Long requestId);

    // ✅ list by status (for RP dashboard: pending approvals)
    List<ServiceOrder> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    // ✅ avoid accidental duplicates (one order per request is typical)
    boolean existsByServiceRequestReferenceId(Long requestId);

    Optional<ServiceOrder> findBySelectedOffer_Id(Long offerId);


    @Modifying
    @Transactional
    @Query("delete from ServiceOrder so where so.serviceRequestReference.id = :requestId")
    void deleteByServiceRequestId(@Param("requestId") Long requestId);
}
