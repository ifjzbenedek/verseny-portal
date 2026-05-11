package com.verseny.portal.controller;

import com.verseny.portal.dto.StudentDtos.StudentCreateRequest;
import com.verseny.portal.dto.StudentDtos.StudentResponse;
import com.verseny.portal.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@Tag(name = "Students", description = "Hallgatók kezelése")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Hallgatók lapozható listája")
    public Page<StudentResponse> list(Pageable pageable) {
        return studentService.list(pageable);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját hallgatói profil")
    public StudentResponse me() {
        return studentService.me();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO','HALLGATO')")
    @Operation(summary = "Egy hallgató lekérdezése")
    public StudentResponse get(@PathVariable Long id) {
        return studentService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hallgató felvétele osztályba")
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentCreateRequest req) {
        return ResponseEntity.status(201).body(studentService.create(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hallgató törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
