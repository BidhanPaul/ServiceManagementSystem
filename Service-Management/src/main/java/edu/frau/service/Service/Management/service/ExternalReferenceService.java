package edu.frau.service.Service.Management.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class ExternalReferenceService {

    private static final String PROJECT_API = "https://69233a5309df4a492324c022.mockapi.io/Projects";
    private static final String CONTRACT_API = "https://69233a5309df4a492324c022.mockapi.io/Contracts";

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllProjects() {
        return restTemplate.getForObject(PROJECT_API, List.class);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllContracts() {
        return restTemplate.getForObject(CONTRACT_API, List.class);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getProject(String projectId) {
        return restTemplate.getForObject(PROJECT_API + "/" + projectId, Map.class);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getContract(String contractId) {
        return restTemplate.getForObject(CONTRACT_API + "/" + contractId, Map.class);
    }
}
