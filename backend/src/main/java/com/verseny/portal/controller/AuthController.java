package com.verseny.portal.controller;

import com.verseny.portal.dto.AuthDtos.*;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Role;
import com.verseny.portal.repository.UserRepository;
import com.verseny.portal.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body("Email already in use");
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
        return ResponseEntity.ok(new AuthResponse(token, u.getEmail(), u.getFullName(), u.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return users.findByEmail(req.email())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(new AuthResponse(
                        jwt.generate(u.getEmail(), u.getRole().name()),
                        u.getEmail(), u.getFullName(), u.getRole())))
                .orElseGet(() -> ResponseEntity.status(401).body("Invalid credentials"));
    }
}
