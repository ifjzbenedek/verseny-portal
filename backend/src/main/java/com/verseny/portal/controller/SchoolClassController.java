package com.verseny.portal.controller;

import com.verseny.portal.dto.SchoolClassDtos.SchoolClassCreateRequest;
import com.verseny.portal.dto.SchoolClassDtos.SchoolClassResponse;
import com.verseny.portal.dto.SchoolClassDtos.SchoolClassUpdateRequest;
import com.verseny.portal.dto.StudentDtos.StudentResponse;
import com.verseny.portal.service.SchoolClassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@Tag(name = "Classes", description = "Iskolai osztályok kezelése")
public class SchoolClassController {

    private final SchoolClassService schoolClassService;

    public SchoolClassController(SchoolClassService schoolClassService) {
        this.schoolClassService = schoolClassService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Összes osztály listázása")
    public List<SchoolClassResponse> list() {
        return schoolClassService.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Egy osztály lekérdezése azonosító alapján")
    public SchoolClassResponse get(@PathVariable Long id) {
        return schoolClassService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új osztály létrehozása")
    public ResponseEntity<SchoolClassResponse> create(@Valid @RequestBody SchoolClassCreateRequest req) {
        return ResponseEntity.status(201).body(schoolClassService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Osztály frissítése")
    public SchoolClassResponse update(@PathVariable Long id, @Valid @RequestBody SchoolClassUpdateRequest req) {
        return schoolClassService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Osztály törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        schoolClassService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Az osztály diákjai")
    public List<StudentResponse> studentsOf(@PathVariable Long id) {
        return schoolClassService.studentsOf(id);
    }
}
