package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Contract;
import java.util.List;
import java.util.Optional;

public interface ContractService {
    Contract createContract(Contract contract);
    Optional<Contract> getContractById(Long id);
    List<Contract> getAllContracts();
    Optional<Contract> updateContract(Long id, Contract contract);
    boolean deleteContract(Long id);
}
