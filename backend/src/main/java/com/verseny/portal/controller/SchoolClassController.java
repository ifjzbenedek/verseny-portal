package com.verseny.portal.controller;

import com.verseny.portal.dto.SchoolClassDtos.*;
import com.verseny.portal.dto.StudentDtos.StudentResponse;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
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

    private final SchoolClassRepository classes;
    private final StudentRepository students;

    public SchoolClassController(SchoolClassRepository classes, StudentRepository students) {
        this.classes = classes;
        this.students = students;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Összes osztály listázása")
    public List<SchoolClassResponse> list() {
        return classes.findAll().stream().map(SchoolClassResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Egy osztály lekérdezése azonosító alapján")
    public SchoolClassResponse get(@PathVariable Long id) {
        return SchoolClassResponse.from(find(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új osztály létrehozása")
    public ResponseEntity<SchoolClassResponse> create(@Valid @RequestBody SchoolClassCreateRequest req) {
        classes.findByStartYearAndIdentifier(req.startYear(), req.identifier()).ifPresent(c -> {
            throw new ConflictException("Class " + req.startYear() + "/" + req.identifier() + " already exists");
        });
        SchoolClass saved = classes.save(SchoolClass.builder()
                .startYear(req.startYear())
                .identifier(req.identifier())
                .build());
        return ResponseEntity.status(201).body(SchoolClassResponse.from(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Osztály frissítése")
    public SchoolClassResponse update(@PathVariable Long id, @Valid @RequestBody SchoolClassUpdateRequest req) {
        SchoolClass c = find(id);
        c.setStartYear(req.startYear());
        c.setIdentifier(req.identifier());
        return SchoolClassResponse.from(classes.save(c));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Osztály törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        SchoolClass c = find(id);
        classes.delete(c);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Az osztály diákjai")
    public List<StudentResponse> studentsOf(@PathVariable Long id) {
        SchoolClass c = find(id);
        return students.findBySchoolClass(c).stream().map(StudentResponse::from).toList();
    }

    private SchoolClass find(Long id) {
        return classes.findById(id).orElseThrow(() -> NotFoundException.of("SchoolClass", id));
    }
}
