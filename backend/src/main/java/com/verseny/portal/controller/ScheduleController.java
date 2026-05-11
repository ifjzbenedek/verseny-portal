package com.verseny.portal.controller;

import com.verseny.portal.dto.ScheduleDtos.ScheduleSlotCreateRequest;
import com.verseny.portal.dto.ScheduleDtos.ScheduleSlotResponse;
import com.verseny.portal.service.ScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@Tag(name = "Schedule", description = "Heti órarend slotok")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/my-class")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját osztály heti órarendje")
    public List<ScheduleSlotResponse> myClass() {
        return scheduleService.myClassSchedule();
    }

    @GetMapping("/my-teaching")
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Saját tanított slotok")
    public List<ScheduleSlotResponse> myTeaching() {
        return scheduleService.myTeachingSchedule();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Összes slot")
    public List<ScheduleSlotResponse> list() {
        return scheduleService.all();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új slot felvétele")
    public ResponseEntity<ScheduleSlotResponse> create(@Valid @RequestBody ScheduleSlotCreateRequest req) {
        return ResponseEntity.status(201).body(scheduleService.create(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Slot törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
