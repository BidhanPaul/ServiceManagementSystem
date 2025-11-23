package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.ServiceOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {
    List<ServiceOrder> findBySupplierName(String supplierName);
}
