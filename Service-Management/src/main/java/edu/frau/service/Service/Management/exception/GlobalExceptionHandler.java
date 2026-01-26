package edu.frau.service.Service.Management.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private boolean isPreflight(HttpServletRequest request) {
        return request != null && "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    // Your original behavior: RuntimeException -> 400 (but not for OPTIONS)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(
            RuntimeException ex,
            ServletWebRequest webRequest
    ) {
        HttpServletRequest request = webRequest.getRequest();
        if (isPreflight(request)) {
            throw ex;
        }
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    // Common MVC errors that often show up as 500 otherwise
    @ExceptionHandler({
            HttpMessageNotWritableException.class, // JSON serialization problems (very common with entities)
            HttpMessageNotReadableException.class, // bad JSON input
            MethodArgumentNotValidException.class   // validation errors
    })
    public ResponseEntity<String> handleMvcMessageExceptions(Exception ex, ServletWebRequest webRequest) {
        HttpServletRequest request = webRequest.getRequest();
        if (isPreflight(request)) {
            throw new RuntimeException(ex);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    // Security exceptions sometimes show up here depending on config
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException ex, ServletWebRequest webRequest) {
        HttpServletRequest request = webRequest.getRequest();
        if (isPreflight(request)) {
            throw ex;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    // Catch-all fallback so you don't get the default Boot 500 JSON without message
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAny(Exception ex, ServletWebRequest webRequest) {
        HttpServletRequest request = webRequest.getRequest();
        if (isPreflight(request)) {
            throw new RuntimeException(ex);
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
    }
}
