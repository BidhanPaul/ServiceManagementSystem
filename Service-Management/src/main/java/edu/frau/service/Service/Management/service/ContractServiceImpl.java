package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Contract;
import edu.frau.service.Service.Management.repository.ContractRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ContractServiceImpl implements ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Override
    public Contract createContract(Contract contract) {
        return contractRepository.save(contract);
    }

    @Override
    public Optional<Contract> getContractById(Long id) {
        return contractRepository.findById(id);
    }

    @Override
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    @Override
    public Optional<Contract> updateContract(Long id, Contract updatedContract) {
        return contractRepository.findById(id).map(existing -> {
            existing.setTitle(updatedContract.getTitle());
            existing.setScope(updatedContract.getScope());
            existing.setTerms(updatedContract.getTerms());
            existing.setStartDate(updatedContract.getStartDate());
            existing.setEndDate(updatedContract.getEndDate());
            existing.setOfferDeadline(updatedContract.getOfferDeadline());
            existing.setFunctionalWeighting(updatedContract.getFunctionalWeighting());
            existing.setCommercialWeighting(updatedContract.getCommercialWeighting());
            return contractRepository.save(existing);
        });
    }

    @Override
    public boolean deleteContract(Long id) {
        return contractRepository.findById(id).map(c -> {
            contractRepository.delete(c);
            return true;
        }).orElse(false);
    }
}
