package com.verseny.portal.controller;

import com.verseny.portal.dto.ScheduleDtos.*;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.ScheduleSlot;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.ScheduleSlotRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import com.verseny.portal.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@Tag(name = "Schedule", description = "Heti órarend slotok")
public class ScheduleController {

    private final ScheduleSlotRepository slots;
    private final SubjectAssignmentRepository assignments;
    private final StudentRepository students;
    private final CurrentUser currentUser;

    public ScheduleController(ScheduleSlotRepository slots,
                              SubjectAssignmentRepository assignments,
                              StudentRepository students,
                              CurrentUser currentUser) {
        this.slots = slots;
        this.assignments = assignments;
        this.students = students;
        this.currentUser = currentUser;
    }

    @GetMapping("/my-class")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját osztály heti órarendje")
    public List<ScheduleSlotResponse> myClass() {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        return slots.findByAssignment_SchoolClass(s.getSchoolClass()).stream()
                .sorted(Comparator
                        .comparing((ScheduleSlot x) -> x.getDayOfWeek())
                        .thenComparing(ScheduleSlot::getStartTime))
                .map(ScheduleSlotResponse::from)
                .toList();
    }

    @GetMapping("/my-teaching")
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Saját tanított slotok")
    public List<ScheduleSlotResponse> myTeaching() {
        AppUser me = currentUser.require();
        return slots.findByAssignment_Teacher(me).stream()
                .sorted(Comparator
                        .comparing((ScheduleSlot x) -> x.getDayOfWeek())
                        .thenComparing(ScheduleSlot::getStartTime))
                .map(ScheduleSlotResponse::from)
                .toList();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Összes slot")
    public List<ScheduleSlotResponse> list() {
        return slots.findAll().stream()
                .sorted(Comparator
                        .comparing((ScheduleSlot x) -> x.getDayOfWeek())
                        .thenComparing(ScheduleSlot::getStartTime))
                .map(ScheduleSlotResponse::from)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új slot felvétele")
    public ResponseEntity<ScheduleSlotResponse> create(@Valid @RequestBody ScheduleSlotCreateRequest req) {
        SubjectAssignment a = assignments.findById(req.assignmentId())
                .orElseThrow(() -> NotFoundException.of("SubjectAssignment", req.assignmentId()));
        if (!req.endTime().isAfter(req.startTime())) {
            throw new ConflictException("endTime must be after startTime");
        }
        ScheduleSlot saved = slots.save(ScheduleSlot.builder()
                .assignment(a)
                .dayOfWeek(req.dayOfWeek())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .room(req.room())
                .build());
        return ResponseEntity.status(201).body(ScheduleSlotResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Slot törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ScheduleSlot s = slots.findById(id).orElseThrow(() -> NotFoundException.of("ScheduleSlot", id));
        slots.delete(s);
        return ResponseEntity.noContent().build();
    }
}
