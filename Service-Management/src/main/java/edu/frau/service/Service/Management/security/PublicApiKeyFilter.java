package edu.frau.service.Service.Management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class PublicApiKeyFilter extends OncePerRequestFilter {

    // Header names
    private static final String HEADER_NAME_PUBLIC = "ServiceRequestbids3a";
    private static final String HEADER_NAME_GROUP3 = "GROUP3-API-KEY";

    // ✅ Env var names (FIXED: separate keys for public vs Group3 webhook)
    private static final String ENV_KEY_PUBLIC = "PUBLIC_BIDDING_API_KEY";
    private static final String ENV_KEY_GROUP3 = "GROUP3_API_KEY";

    private boolean isOneOf(String path, String... allowed) {
        if (path == null) return false;
        for (String a : allowed) {
            if (a.equals(path)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String method = request.getMethod();
        String path = request.getServletPath();

        boolean isPublicProtected =
                HttpMethod.POST.matches(method) &&
                        isOneOf(path,
                                "/api/public/bids",
                                "/api/public/bids/",
                                "/api/public/order-changes/extension",
                                "/api/public/order-changes/extension/",
                                "/api/public/order-changes/substitution",
                                "/api/public/order-changes/substitution/"
                        );

        boolean isGroup3Webhook =
                HttpMethod.POST.matches(method)
                        && path != null
                        && (path.startsWith("/api/integrations/group3/offers/")
                        || path.startsWith("/api/integrations/group3/offers"))
                        && (path.endsWith("/decision") || path.endsWith("/decision/"));

        // Not protected by this filter
        if (!isPublicProtected && !isGroup3Webhook) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Choose the correct expected key based on which flow it is
        String expectedKey = System.getenv(isGroup3Webhook ? ENV_KEY_GROUP3 : ENV_KEY_PUBLIC);

        // ✅ Choose the correct header based on which flow it is
        String providedKey = isGroup3Webhook
                ? request.getHeader(HEADER_NAME_GROUP3)
                : request.getHeader(HEADER_NAME_PUBLIC);

        expectedKey = expectedKey == null ? null : expectedKey.trim();
        providedKey = providedKey == null ? null : providedKey.trim();

        if (expectedKey == null || expectedKey.isBlank() || providedKey == null || !expectedKey.equals(providedKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain; charset=utf-8");
            response.getWriter().write("Missing or invalid API key");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
