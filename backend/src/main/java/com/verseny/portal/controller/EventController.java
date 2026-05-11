package com.verseny.portal.controller;

import com.verseny.portal.dto.EventDtos.EventCreateRequest;
import com.verseny.portal.dto.EventDtos.EventResponse;
import com.verseny.portal.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@Tag(name = "Events", description = "Iskolai események kezelése")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Összes esemény (kezdés szerint növekvő sorrend)")
    public List<EventResponse> list() {
        return eventService.listAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új esemény létrehozása")
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventCreateRequest req) {
        return ResponseEntity.status(201).body(eventService.create(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Esemény törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
