//package edu.frau.service.Service.Management.service;
//
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.List;
//import java.util.Map;
//
//@Service
//public class ExternalReferenceService {
//
//    private static final String PROJECT_API = "https://69233a5309df4a492324c022.mockapi.io/Projects";
//    private static final String CONTRACT_API = "https://69233a5309df4a492324c022.mockapi.io/Contracts";
//
//    private final RestTemplate restTemplate = new RestTemplate();
//
//    @SuppressWarnings("unchecked")
//    public List<Map<String, Object>> getAllProjects() {
//        return restTemplate.getForObject(PROJECT_API, List.class);
//    }
//
//    @SuppressWarnings("unchecked")
//    public List<Map<String, Object>> getAllContracts() {
//        return restTemplate.getForObject(CONTRACT_API, List.class);
//    }
//
//    @SuppressWarnings("unchecked")
//    public Map<String, Object> getProject(String projectId) {
//        return restTemplate.getForObject(PROJECT_API + "/" + projectId, Map.class);
//    }
//
//    @SuppressWarnings("unchecked")
//    public Map<String, Object> getContract(String contractId) {
//        return restTemplate.getForObject(CONTRACT_API + "/" + contractId, Map.class);
//    }
//}
///---------------- NEW---------------------------------
package edu.frau.service.Service.Management.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class ExternalReferenceService {

    // Other team's published projects endpoint (can return JSON if we send Accept: application/json)
    private static final String PROJECT_API =
            "https://workforcemangementtool.onrender.com/api/projects";

    // Your mock contracts endpoint (JSON)
    private static final String CONTRACT_API =
            "https://69233a5309df4a492324c022.mockapi.io/Contracts";

    private final RestTemplate restTemplate = new RestTemplate();

    // ---------------- PROJECTS ----------------

    /**
     * Returns the full response: { "message": "...", "data": [ ... ] }
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getProjectsResponse() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                PROJECT_API,
                HttpMethod.GET,
                entity,
                Map.class
        );

        return (Map<String, Object>) response.getBody();
    }

    /**
     * Returns only the array inside "data": [ ... ]
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllProjects() {
        Map<String, Object> body = getProjectsResponse();
        if (body == null) return List.of();

        Object data = body.get("data");
        if (data instanceof List<?> list) {
            return (List<Map<String, Object>>) data;
        }
        return List.of();
    }

    /**
     * The other team's endpoint returns ALL published projects.
     * So to "get one", we filter locally by either projectId or id.
     */
    public Map<String, Object> getProject(String projectIdOrId) {
        return getAllProjects().stream()
                .filter(p ->
                        projectIdOrId.equals(String.valueOf(p.get("projectId"))) ||
                                projectIdOrId.equals(String.valueOf(p.get("id")))
                )
                .findFirst()
                .orElse(null);
    }

    // ---------------- CONTRACTS ----------------

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllContracts() {
        return restTemplate.getForObject(CONTRACT_API, List.class);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getContract(String contractId) {
        return restTemplate.getForObject(CONTRACT_API + "/" + contractId, Map.class);
    }
}
