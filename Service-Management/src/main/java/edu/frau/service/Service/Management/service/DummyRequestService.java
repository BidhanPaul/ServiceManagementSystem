package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.ServiceRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class DummyRequestService {
    private final String DUMMY_URL = "https://jsonplaceholder.typicode.com/posts";

    public List<ServiceRequest> getDummyRequests() {
        RestTemplate rest = new RestTemplate();
        Object[] posts = rest.getForObject(DUMMY_URL, Object[].class); // map later
        // convert as needed; simpler approach: fetch, map to ServiceRequest DTO manually if desired.
        return List.of(); // placeholder
    }
}
