package com.verseny.portal.dto;

import com.verseny.portal.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password) {}

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 4) String password,
            @NotBlank String fullName,
            Role role) {}

    public record AuthResponse(
            String token,
            String email,
            String fullName,
            Role role) {}
}
