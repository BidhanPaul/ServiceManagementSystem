package edu.frau.service.Service.Management.dto;

import edu.frau.service.Service.Management.model.Role;

import java.time.LocalDate;

public record UserUpdateRequest(
        String username,
        String email,
        LocalDate dob,
        String password,
        Role role
) {}
