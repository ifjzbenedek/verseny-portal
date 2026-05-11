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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository users;
    @Mock PasswordEncoder encoder;
    @Mock JwtUtil jwt;
    @InjectMocks AuthService service;

    @Test
    void register_newEmail_persistsAndReturnsToken() {
        when(users.existsByEmail("new@p.hu")).thenReturn(false);
        when(encoder.encode("secret123")).thenReturn("$bcrypt$");
        when(jwt.generate("new@p.hu", "HALLGATO")).thenReturn("jwt-token");

        AuthResponse response = service.register(
                new RegisterRequest("new@p.hu", "secret123", "Új Felhasználó", Role.HALLGATO));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(users).save(captor.capture());
        AppUser persisted = captor.getValue();
        assertThat(persisted.getEmail()).isEqualTo("new@p.hu");
        assertThat(persisted.getPasswordHash()).isEqualTo("$bcrypt$");
        assertThat(persisted.getRole()).isEqualTo(Role.HALLGATO);
        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("new@p.hu");
        assertThat(response.role()).isEqualTo(Role.HALLGATO);
    }

    @Test
    void register_existingEmail_throwsConflict() {
        when(users.existsByEmail("dup@p.hu")).thenReturn(true);

        assertThatThrownBy(() -> service.register(
                new RegisterRequest("dup@p.hu", "secret123", "X", Role.HALLGATO)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already in use");
        verify(users, never()).save(any());
    }

    @Test
    void register_nullRole_defaultsToHallgato() {
        when(users.existsByEmail(any())).thenReturn(false);
        when(encoder.encode(any())).thenReturn("hash");
        when(jwt.generate(eq("a@p.hu"), eq("HALLGATO"))).thenReturn("tok");

        AuthResponse response = service.register(
                new RegisterRequest("a@p.hu", "secret123", "Anna", null));

        assertThat(response.role()).isEqualTo(Role.HALLGATO);
    }

    @Test
    void login_validCredentials_returnsToken() {
        AppUser u = AppUser.builder()
                .id(1L).email("u@p.hu").passwordHash("$bcrypt$")
                .fullName("User").role(Role.OKTATO).build();
        when(users.findByEmail("u@p.hu")).thenReturn(Optional.of(u));
        when(encoder.matches("password", "$bcrypt$")).thenReturn(true);
        when(jwt.generate("u@p.hu", "OKTATO")).thenReturn("jwt-oktato");

        AuthResponse response = service.login(new LoginRequest("u@p.hu", "password"));

        assertThat(response.token()).isEqualTo("jwt-oktato");
        assertThat(response.role()).isEqualTo(Role.OKTATO);
    }

    @Test
    void login_badPassword_throwsAuthorization() {
        AppUser u = AppUser.builder()
                .email("u@p.hu").passwordHash("$bcrypt$")
                .fullName("U").role(Role.HALLGATO).build();
        when(users.findByEmail("u@p.hu")).thenReturn(Optional.of(u));
        when(encoder.matches("wrong", "$bcrypt$")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("u@p.hu", "wrong")))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_unknownEmail_throwsAuthorization() {
        when(users.findByEmail("ghost@p.hu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("ghost@p.hu", "x")))
                .isInstanceOf(AuthorizationException.class);
    }
}
