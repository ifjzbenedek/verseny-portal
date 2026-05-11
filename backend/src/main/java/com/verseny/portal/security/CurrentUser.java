package com.verseny.portal.security;

import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private final UserRepository users;

    public CurrentUser(UserRepository users) {
        this.users = users;
    }

    public AppUser require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AuthorizationException("No authenticated user");
        }
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new NotFoundException("Authenticated user not found: " + auth.getName()));
    }

    public AppUser from(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AuthorizationException("No authenticated user");
        }
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new NotFoundException("Authenticated user not found: " + auth.getName()));
    }
}
