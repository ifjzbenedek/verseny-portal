package com.verseny.portal.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Health", description = "Liveness probe")
public class HealthController {
    @GetMapping("/api/health")
    @Operation(summary = "Egészségügyi ellenőrzés (publikus)")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
