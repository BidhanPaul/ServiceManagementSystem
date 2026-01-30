package edu.frau.service.Service.Management.integration.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class Group3IntegrationClient {

    private static final String GROUP3_BASE =
            "https://provider-management-system-production.up.railway.app/api/integrations/group3/";

    private static final String OFFERS_URL =
            GROUP3_BASE + "offers/"; // + {offerId}/decision/

    private static final String CHANGE_SUBSTITUTION_URL =
            GROUP3_BASE + "order-changes/substitution/"; // POST

    private static final String CHANGE_EXTENSION_URL =
            GROUP3_BASE + "order-changes/extension/"; // POST

    private static final String API_KEY_ENV = "GROUP3_API_KEY";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public Group3IntegrationClient(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    // ---------------- Offer decision (same as your last working) ----------------
    public void sendDecision(Long offerId, String decision) {
        sendDecisionInternal(offerId, decision, false);
    }

    // ---------------- Offer decision + return provider serviceOrder.id (only for ACCEPTED) ----------------
    public Long sendDecisionAndGetProviderOrderId(Long offerId, String decision) {
        return sendDecisionInternal(offerId, decision, true);
    }

    private Long sendDecisionInternal(Long offerId, String decision, boolean returnProviderOrderId) {
        if (offerId == null) throw new IllegalArgumentException("offerId cannot be null");
        if (decision == null) throw new IllegalArgumentException("decision cannot be null");

        // Normalize decision EXACTLY to what Group3 accepts
        String normalized = decision.trim().toUpperCase();
        if (!normalized.equals("SUBMITTED") && !normalized.equals("ACCEPTED") && !normalized.equals("REJECTED")) {
            throw new IllegalArgumentException("Invalid Group3 decision: " + decision +
                    " (must be SUBMITTED, ACCEPTED, REJECTED)");
        }

        String url = OFFERS_URL + offerId + "/decision/";

        String apiKey = System.getenv(API_KEY_ENV);
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing env var: " + API_KEY_ENV);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set("GROUP3-API-KEY", apiKey);

        // ✅ Keep exactly your last working structure
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("serviceOfferId", offerId);
        body.put("decision", normalized);

        try {
            // ✅ Force JSON string body (prevents map serialization issues)
            String json = objectMapper.writeValueAsString(body);

            HttpEntity<String> entity = new HttpEntity<>(json, headers);

            ResponseEntity<String> res = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (!returnProviderOrderId) return null;

            // Provider order id exists only after ACCEPTED and response includes serviceOrder.id
            if (!"ACCEPTED".equals(normalized)) return null;

            String respBody = res.getBody();
            if (respBody == null || respBody.isBlank()) return null;

            JsonNode root = objectMapper.readTree(respBody);
            JsonNode idNode = root.path("serviceOrder").path("id");
            if (idNode.isMissingNode() || idNode.isNull()) return null;

            return idNode.asLong();

        } catch (HttpStatusCodeException ex) {
            System.out.println("========== Group3 call failed ==========");
            System.out.println("URL: " + url);
            System.out.println("Decision(original): " + decision);
            System.out.println("Decision(normalized): " + normalized);
            System.out.println("Request body(map): " + body);
            System.out.println("Response status: " + ex.getStatusCode());
            System.out.println("Response body: " + ex.getResponseBodyAsString());
            System.out.println("=======================================");
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Group3 integration failed unexpectedly: " + ex.getMessage(), ex);
        }
    }

    // ---------------- Substitution Change (providerOrderId REQUIRED) ----------------
    public void sendSubstitutionChange(Long providerOrderId, LocalDate substitutionDate, String comment) {
        if (providerOrderId == null) throw new IllegalArgumentException("providerOrderId cannot be null");
        if (substitutionDate == null) throw new IllegalArgumentException("substitutionDate cannot be null");

        HttpHeaders headers = buildHeaders();

        Map<String, Object> inner = new LinkedHashMap<>();
        inner.put("substitutionDate", substitutionDate.toString());
        inner.put("comment", comment == null ? "" : comment);

        Map<String, Object> outer = new LinkedHashMap<>();
        outer.put("orderId", providerOrderId);
        outer.put("body", inner);

        try {
            String json = objectMapper.writeValueAsString(outer);
            HttpEntity<String> entity = new HttpEntity<>(json, headers);

            restTemplate.exchange(
                    CHANGE_SUBSTITUTION_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

        } catch (HttpStatusCodeException ex) {
            System.out.println("========= Group3 substitution change call failed ==========");
            System.out.println("URL: " + CHANGE_SUBSTITUTION_URL);
            System.out.println("Request body(map): " + outer);
            System.out.println("Response status: " + ex.getStatusCode());
            System.out.println("Response body: " + ex.getResponseBodyAsString());
            System.out.println("=========================================================");
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Group3 substitution call failed unexpectedly: " + ex.getMessage(), ex);
        }
    }

    // ---------------- Extension Change (providerOrderId REQUIRED) ----------------
    public void sendExtensionChange(Long providerOrderId, LocalDate newEndDate, Integer newManDays, Double newContractValue, String comment) {
        if (providerOrderId == null) throw new IllegalArgumentException("providerOrderId cannot be null");
        if (newEndDate == null) throw new IllegalArgumentException("newEndDate cannot be null");
        if (newManDays == null) throw new IllegalArgumentException("newManDays cannot be null");
        if (newContractValue == null) throw new IllegalArgumentException("newContractValue cannot be null");

        HttpHeaders headers = buildHeaders();

        Map<String, Object> inner = new LinkedHashMap<>();
        inner.put("newEndDate", newEndDate.toString());
        inner.put("newManDays", newManDays);
        inner.put("newContractValue", newContractValue);
        inner.put("comment", comment == null ? "" : comment);

        Map<String, Object> outer = new LinkedHashMap<>();
        outer.put("orderId", providerOrderId);
        outer.put("body", inner);

        try {
            String json = objectMapper.writeValueAsString(outer);
            HttpEntity<String> entity = new HttpEntity<>(json, headers);

            restTemplate.exchange(
                    CHANGE_EXTENSION_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

        } catch (HttpStatusCodeException ex) {
            System.out.println("========= Group3 extension change call failed ==========");
            System.out.println("URL: " + CHANGE_EXTENSION_URL);
            System.out.println("Request body(map): " + outer);
            System.out.println("Response status: " + ex.getStatusCode());
            System.out.println("Response body: " + ex.getResponseBodyAsString());
            System.out.println("=======================================================");
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Group3 extension call failed unexpectedly: " + ex.getMessage(), ex);
        }
    }

    // ---------------- helpers ----------------
    private HttpHeaders buildHeaders() {
        String apiKey = System.getenv(API_KEY_ENV);
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing env var: " + API_KEY_ENV);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set("GROUP3-API-KEY", apiKey);
        return headers;
    }
}
