package com.verseny.portal.controller;

import com.verseny.portal.dto.SubjectDtos.*;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.Subject;
import com.verseny.portal.repository.SubjectRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@Tag(name = "Subjects", description = "Tantárgyak kezelése")
public class SubjectController {

    private final SubjectRepository subjects;

    public SubjectController(SubjectRepository subjects) {
        this.subjects = subjects;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Összes tárgy")
    public List<SubjectResponse> list() {
        return subjects.findAll().stream().map(SubjectResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Egy tárgy részletei")
    public SubjectResponse get(@PathVariable Long id) {
        return SubjectResponse.from(find(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új tárgy létrehozása")
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody SubjectCreateRequest req) {
        Subject saved = subjects.save(Subject.builder()
                .name(req.name())
                .description(req.description())
                .requiredBook(req.requiredBook())
                .lessonsJson(req.lessonsJson())
                .build());
        return ResponseEntity.status(201).body(SubjectResponse.from(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Tárgy frissítése")
    public SubjectResponse update(@PathVariable Long id, @Valid @RequestBody SubjectUpdateRequest req) {
        Subject s = find(id);
        s.setName(req.name());
        s.setDescription(req.description());
        s.setRequiredBook(req.requiredBook());
        s.setLessonsJson(req.lessonsJson());
        return SubjectResponse.from(subjects.save(s));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Tárgy törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Subject s = find(id);
        subjects.delete(s);
        return ResponseEntity.noContent().build();
    }

    private Subject find(Long id) {
        return subjects.findById(id).orElseThrow(() -> NotFoundException.of("Subject", id));
    }
}
