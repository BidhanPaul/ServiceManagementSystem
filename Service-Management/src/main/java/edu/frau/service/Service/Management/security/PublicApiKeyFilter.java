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

    // Header name (as required)
    private static final String HEADER_NAME = "ServiceRequestbids3a";

    // 🔐 Read secret from environment variable (Render)
    private static final String ENV_KEY_NAME = "PUBLIC_BIDDING_API_KEY";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String method = request.getMethod();
        String path = request.getServletPath();

        boolean isProtected =
                HttpMethod.POST.matches(method) &&
                        (
                                path.equals("/api/public/bids") ||
                                        path.equals("/api/public/order-changes/extension") ||
                                        path.equals("/api/public/order-changes/substitution")
                        );

        if (!isProtected) {
            filterChain.doFilter(request, response);
            return;
        }

        String expectedKey = System.getenv(ENV_KEY_NAME);
        String providedKey = request.getHeader(HEADER_NAME);

        if (expectedKey == null || providedKey == null || !expectedKey.equals(providedKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain; charset=utf-8");
            response.getWriter().write("Missing or invalid API key");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
