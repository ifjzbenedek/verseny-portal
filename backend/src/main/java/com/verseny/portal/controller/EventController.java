package com.verseny.portal.controller;

import com.verseny.portal.dto.EventDtos.*;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.Event;
import com.verseny.portal.repository.EventRepository;
import com.verseny.portal.security.CurrentUser;
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

    private final EventRepository events;
    private final CurrentUser currentUser;

    public EventController(EventRepository events, CurrentUser currentUser) {
        this.events = events;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Összes esemény (kezdés szerint növekvő sorrend)")
    public List<EventResponse> list() {
        return events.findAllByOrderByStartAtAsc().stream().map(EventResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új esemény létrehozása")
    public ResponseEntity<EventResponse> create(@Valid @RequestBody EventCreateRequest req) {
        Event saved = events.save(Event.builder()
                .title(req.title())
                .description(req.description())
                .startAt(req.startAt())
                .endAt(req.endAt())
                .location(req.location())
                .createdBy(currentUser.require())
                .build());
        return ResponseEntity.status(201).body(EventResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Esemény törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Event e = events.findById(id).orElseThrow(() -> NotFoundException.of("Event", id));
        events.delete(e);
        return ResponseEntity.noContent().build();
    }
}
