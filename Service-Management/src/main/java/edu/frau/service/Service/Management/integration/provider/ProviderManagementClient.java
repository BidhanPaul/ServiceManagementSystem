package edu.frau.service.Service.Management.integration.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Service
@ConditionalOnProperty(name = "provider.api.enabled", havingValue = "true")
public class ProviderManagementClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${provider.api.baseUrl:}")
    private String baseUrl;

    @Value("${provider.api.offersPath:}")
    private String offersPath;

    public List<ProviderOfferDTO> fetchAllOffers() {
        if (baseUrl.isBlank() || offersPath.isBlank()) return Collections.emptyList();

        String url = baseUrl + offersPath;

        List<ProviderOfferDTO> data = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<ProviderOfferDTO>>() {}
        ).getBody();

        return data != null ? data : Collections.emptyList();
    }
}
