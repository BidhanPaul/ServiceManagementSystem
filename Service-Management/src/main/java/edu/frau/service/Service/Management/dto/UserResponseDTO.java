package edu.frau.service.Service.Management.dto;

import edu.frau.service.Service.Management.model.User;

import java.time.LocalDate;
import java.util.UUID;

public record UserResponseDTO(
        UUID id,
        String username,
        String email,
        LocalDate dob,
        String role
) {
    public static UserResponseDTO from(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDob(),
                user.getRole() == null ? null : user.getRole().name()
        );
    }
}
