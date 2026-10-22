package edu.frau.service.Service.Management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class PublicApiKeyFilter extends OncePerRequestFilter {

    // Header names
    private static final String HEADER_NAME_PUBLIC = "ServiceRequestbids3a";
    private static final String HEADER_NAME_GROUP3 = "GROUP3-API-KEY";
    private static final String HEADER_NAME_GROUP4 = "GROUP4-API-KEY";

    // ✅ Env var names (FIXED: separate keys for public vs Group3 webhook)
    private static final String ENV_KEY_PUBLIC = "PUBLIC_BIDDING_API_KEY";
    private static final String ENV_KEY_GROUP3 = "GROUP3_API_KEY";
    private static final String ENV_KEY_GROUP4 = "GROUP4_API_KEY";

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

        boolean isPublicProtected = HttpMethod.POST.matches(method) && (
                isOneOf(path,
                        "/api/public/bids",
                        "/api/public/bids/",
                        "/api/public/order-changes/extension",
                        "/api/public/order-changes/extension/",
                        "/api/public/order-changes/substitution",
                        "/api/public/order-changes/substitution/"
                ) || path != null && path.matches("/api/requests/[^/]+/offers/?"));

        boolean isGroup3Webhook =
                HttpMethod.POST.matches(method)
                        && path != null
                        && (path.startsWith("/api/integrations/group3/offers/")
                        || path.startsWith("/api/integrations/group3/offers"))
                        && (path.endsWith("/decision") || path.endsWith("/decision/"));

        boolean isGroup4Webhook = HttpMethod.POST.matches(method)
                && path != null
                && (path.startsWith("/api/integrations/group4/")
                || path.startsWith("/api/public/provider/group4/"))
                && (path.endsWith("/decision") || path.endsWith("/decision/"));

        // Not protected by this filter
        if (!isPublicProtected && !isGroup3Webhook) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Choose the correct expected key based on which flow it is
        String expectedKey = System.getenv(isGroup3Webhook ? ENV_KEY_GROUP3
                : isGroup4Webhook ? ENV_KEY_GROUP4 : ENV_KEY_PUBLIC);

        // ✅ Choose the correct header based on which flow it is
        String providedKey = isGroup3Webhook
                ? request.getHeader(HEADER_NAME_GROUP3)
                : isGroup4Webhook
                ? request.getHeader(HEADER_NAME_GROUP4)
                : request.getHeader(HEADER_NAME_PUBLIC);

        expectedKey = expectedKey == null ? null : expectedKey.trim();
        providedKey = providedKey == null ? null : providedKey.trim();

        boolean valid = expectedKey != null && !expectedKey.isBlank()
                && providedKey != null
                && MessageDigest.isEqual(
                expectedKey.getBytes(StandardCharsets.UTF_8),
                providedKey.getBytes(StandardCharsets.UTF_8));
        if (!valid) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain; charset=utf-8");
            response.getWriter().write("Missing or invalid API key");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
