package edu.frau.service.Service.Management.integration.provider;

import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class Group3IntegrationClient {

    private static final String GROUP3_URL =
            "https://provider-management-system-production.up.railway.app/api/integrations/group3/offers/";

    private static final String API_KEY_ENV = "GROUP3_API_KEY";

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendDecision(Long offerId, String decision) {

        if (offerId == null) {
            throw new IllegalArgumentException("offerId cannot be null");
        }
        if (decision == null) {
            throw new IllegalArgumentException("decision cannot be null");
        }

        // ✅ Normalize decision EXACTLY to what Group3 accepts
        String normalized = decision.trim().toUpperCase();
        if (!normalized.equals("SUBMITTED") && !normalized.equals("ACCEPTED") && !normalized.equals("REJECTED")) {
            throw new IllegalArgumentException("Invalid Group3 decision: " + decision +
                    " (must be SUBMITTED, ACCEPTED, REJECTED)");
        }

        String url = GROUP3_URL + offerId + "/decision/";

        String apiKey = System.getenv(API_KEY_ENV);
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing env var: " + API_KEY_ENV);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("GROUP3-API-KEY", apiKey);

        Map<String, Object> body = Map.of(
                "serviceOfferId", offerId,
                "decision", normalized
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (HttpStatusCodeException ex) {
            System.out.println("Group3 call failed!");
            System.out.println("URL = " + url);
            System.out.println("Decision(original) = " + decision);
            System.out.println("Decision(normalized) = " + normalized);
            System.out.println("Request body = " + body);
            System.out.println("Response status = " + ex.getStatusCode());
            System.out.println("Response body = " + ex.getResponseBodyAsString());
            throw ex;
        }
    }
}
