package edu.frau.service.Service.Management.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(
            RuntimeException ex,
            ServletWebRequest webRequest
    ) {
        HttpServletRequest request = webRequest.getRequest();

        // ✅ CRITICAL: never interfere with CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            throw ex; // let Spring handle it so CORS headers are applied
        }

        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
