package com.verseny.portal.controller;

import com.verseny.portal.dto.SubjectDtos.SubjectCreateRequest;
import com.verseny.portal.dto.SubjectDtos.SubjectResponse;
import com.verseny.portal.dto.SubjectDtos.SubjectUpdateRequest;
import com.verseny.portal.service.SubjectService;
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

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Összes tárgy")
    public List<SubjectResponse> list() {
        return subjectService.list();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Egy tárgy részletei")
    public SubjectResponse get(@PathVariable Long id) {
        return subjectService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új tárgy létrehozása")
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody SubjectCreateRequest req) {
        return ResponseEntity.status(201).body(subjectService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Tárgy frissítése")
    public SubjectResponse update(@PathVariable Long id, @Valid @RequestBody SubjectUpdateRequest req) {
        return subjectService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Tárgy törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
