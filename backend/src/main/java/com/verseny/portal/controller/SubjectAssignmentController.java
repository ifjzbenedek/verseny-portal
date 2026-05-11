package com.verseny.portal.controller;

import com.verseny.portal.dto.SubjectAssignmentDtos.SubjectAssignmentCreateRequest;
import com.verseny.portal.dto.SubjectAssignmentDtos.SubjectAssignmentResponse;
import com.verseny.portal.service.SubjectAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@Tag(name = "Subject Assignments", description = "Tárgy–osztály–tanár hozzárendelés adott évben")
public class SubjectAssignmentController {

    private final SubjectAssignmentService subjectAssignmentService;

    public SubjectAssignmentController(SubjectAssignmentService subjectAssignmentService) {
        this.subjectAssignmentService = subjectAssignmentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hozzárendelések szűréssel (year, classId, teacherId)")
    public List<SubjectAssignmentResponse> list(@RequestParam(required = false) Integer year,
                                                @RequestParam(required = false) Long classId,
                                                @RequestParam(required = false) Long teacherId) {
        return subjectAssignmentService.list(year, classId, teacherId);
    }

    @GetMapping("/my-teaching")
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Saját tanított tárgyak az aktuális évben")
    public List<SubjectAssignmentResponse> myTeaching() {
        return subjectAssignmentService.myTeaching();
    }

    @GetMapping("/my-subjects")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját osztály tárgyai az aktuális évben")
    public List<SubjectAssignmentResponse> mySubjects() {
        return subjectAssignmentService.mySubjects();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új hozzárendelés (osztály + tárgy + tanár + év)")
    public ResponseEntity<SubjectAssignmentResponse> create(@Valid @RequestBody SubjectAssignmentCreateRequest req) {
        return ResponseEntity.status(201).body(subjectAssignmentService.create(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hozzárendelés törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        subjectAssignmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
