package edu.frau.service.Service.Management.exception;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FilterExceptionCatcherFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            // Don't break preflight
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                throw ex;
            }

            // If response already started, rethrow
            if (response.isCommitted()) {
                throw ex;
            }

            response.resetBuffer();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("text/plain; charset=utf-8");
            response.getWriter().write(ex.getMessage() != null ? ex.getMessage() : "Internal Server Error");
            response.flushBuffer();
        }
    }
}
