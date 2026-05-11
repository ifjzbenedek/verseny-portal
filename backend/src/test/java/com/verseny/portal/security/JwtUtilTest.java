package com.verseny.portal.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String SECRET = "test-secret-needs-to-be-at-least-32-bytes-long-padding-here-padding";

    @Test
    void generate_setsSubjectAndRoleClaim() {
        JwtUtil util = new JwtUtil(SECRET, 60_000L);

        String token = util.generate("user@p.hu", "HALLGATO");
        Claims claims = util.parse(token);

        assertThat(claims.getSubject()).isEqualTo("user@p.hu");
        assertThat(claims.get("role", String.class)).isEqualTo("HALLGATO");
    }

    @Test
    void generate_setsIssuedAndExpiration() {
        long ttl = 60_000L;
        JwtUtil util = new JwtUtil(SECRET, ttl);

        String token = util.generate("u@p.hu", "ADMIN");
        Claims claims = util.parse(token);

        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();
        long delta = claims.getExpiration().getTime() - claims.getIssuedAt().getTime();
        assertThat(delta).isEqualTo(ttl);
    }

    @Test
    void parse_withDifferentSecret_throws() {
        JwtUtil signer = new JwtUtil(SECRET, 60_000L);
        JwtUtil verifier = new JwtUtil(
                "another-secret-that-is-also-at-least-32-bytes-long-padding-here-too", 60_000L);
        String token = signer.generate("u@p.hu", "ADMIN");

        assertThatThrownBy(() -> verifier.parse(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void parse_expiredToken_throws() throws InterruptedException {
        // JWT "exp" claim has second granularity per RFC 7519, so we need to clear at
        // least one whole second between issuing and parsing.
        JwtUtil util = new JwtUtil(SECRET, 100L);
        String token = util.generate("u@p.hu", "HALLGATO");
        Thread.sleep(1200);

        assertThatThrownBy(() -> util.parse(token)).isInstanceOf(JwtException.class);
    }
}
