package edu.frau.service.Service.Management.integration.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Service
public class ProviderManagementClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${provider.api.baseUrl}")
    private String baseUrl;

    @Value("${provider.api.offersPath}")
    private String offersPath;

    public List<ProviderOfferDTO> fetchAllOffers() {
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
