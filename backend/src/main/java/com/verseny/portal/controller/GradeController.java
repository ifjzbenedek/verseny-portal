package com.verseny.portal.controller;

import com.verseny.portal.dto.GradeDtos.ClassSubjectAverageResponse;
import com.verseny.portal.dto.GradeDtos.GradeCreateRequest;
import com.verseny.portal.dto.GradeDtos.GradeResponse;
import com.verseny.portal.dto.GradeDtos.GradeUpdateRequest;
import com.verseny.portal.service.GradingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@Tag(name = "Grades", description = "Jegyek kezelése")
public class GradeController {

    private final GradingService gradingService;

    public GradeController(GradingService gradingService) {
        this.gradingService = gradingService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját jegyek, opcionális subjectId szűréssel")
    public List<GradeResponse> myGrades(@RequestParam(required = false) Long subjectId) {
        return gradingService.gradesForCurrentStudent(subjectId);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Egy diák jegyei (OKTATO csak saját tárgy, ADMIN mindent)")
    public List<GradeResponse> ofStudent(@PathVariable Long studentId) {
        return gradingService.gradesOfStudent(studentId);
    }

    @PostMapping
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Új jegy beírása (csak a saját assignment-be)")
    public ResponseEntity<GradeResponse> create(@Valid @RequestBody GradeCreateRequest req) {
        return ResponseEntity.status(201).body(gradingService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Jegy módosítása (csak ha saját assignment)")
    public GradeResponse update(@PathVariable Long id, @Valid @RequestBody GradeUpdateRequest req) {
        return gradingService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Jegy törlése (OKTATO csak sajátját)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gradingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/class/{classId}/subject/{subjectId}/average")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Osztály+tárgy súlyozott átlagai diákonként")
    public ClassSubjectAverageResponse classSubjectAverage(@PathVariable Long classId, @PathVariable Long subjectId) {
        return gradingService.classSubjectAverage(classId, subjectId);
    }
}
