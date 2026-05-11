package com.verseny.portal.service;

import com.verseny.portal.dto.AuthDtos.AuthResponse;
import com.verseny.portal.dto.AuthDtos.LoginRequest;
import com.verseny.portal.dto.AuthDtos.RegisterRequest;
import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Role;
import com.verseny.portal.repository.UserRepository;
import com.verseny.portal.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ConflictException("Email already in use");
        }
        Role role = req.role() != null ? req.role() : Role.HALLGATO;
        AppUser u = AppUser.builder()
                .email(req.email())
                .passwordHash(encoder.encode(req.password()))
                .fullName(req.fullName())
                .role(role)
                .build();
        users.save(u);
        String token = jwt.generate(u.getEmail(), u.getRole().name());
        return new AuthResponse(token, u.getEmail(), u.getFullName(), u.getRole());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        return users.findByEmail(req.email())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .map(u -> new AuthResponse(
                        jwt.generate(u.getEmail(), u.getRole().name()),
                        u.getEmail(), u.getFullName(), u.getRole()))
                .orElseThrow(() -> new AuthorizationException("Invalid credentials"));
    }
}
