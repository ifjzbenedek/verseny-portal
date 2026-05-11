package com.verseny.portal.controller;

import com.verseny.portal.dto.SubjectAssignmentDtos.*;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Role;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.Subject;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import com.verseny.portal.repository.SubjectRepository;
import com.verseny.portal.repository.UserRepository;
import com.verseny.portal.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@Tag(name = "Subject Assignments", description = "Tárgy–osztály–tanár hozzárendelés adott évben")
public class SubjectAssignmentController {

    private final SubjectAssignmentRepository assignments;
    private final SchoolClassRepository classes;
    private final SubjectRepository subjects;
    private final UserRepository users;
    private final StudentRepository students;
    private final CurrentUser currentUser;

    public SubjectAssignmentController(SubjectAssignmentRepository assignments,
                                       SchoolClassRepository classes,
                                       SubjectRepository subjects,
                                       UserRepository users,
                                       StudentRepository students,
                                       CurrentUser currentUser) {
        this.assignments = assignments;
        this.classes = classes;
        this.subjects = subjects;
        this.users = users;
        this.students = students;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hozzárendelések szűréssel (year, classId, teacherId)")
    public List<SubjectAssignmentResponse> list(@RequestParam(required = false) Integer year,
                                                @RequestParam(required = false) Long classId,
                                                @RequestParam(required = false) Long teacherId) {
        return assignments.findAll().stream()
                .filter(a -> year == null || a.getYear().equals(year))
                .filter(a -> classId == null || (a.getSchoolClass() != null && a.getSchoolClass().getId().equals(classId)))
                .filter(a -> teacherId == null || (a.getTeacher() != null && a.getTeacher().getId().equals(teacherId)))
                .map(SubjectAssignmentResponse::from)
                .toList();
    }

    @GetMapping("/my-teaching")
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Saját tanított tárgyak az aktuális évben")
    public List<SubjectAssignmentResponse> myTeaching() {
        AppUser me = currentUser.require();
        int year = LocalDate.now().getYear();
        return assignments.findByTeacher(me).stream()
                .filter(a -> a.getYear() != null && a.getYear() == year)
                .map(SubjectAssignmentResponse::from)
                .toList();
    }

    @GetMapping("/my-subjects")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját osztály tárgyai az aktuális évben")
    public List<SubjectAssignmentResponse> mySubjects() {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        int year = LocalDate.now().getYear();
        return assignments.findBySchoolClassAndYear(s.getSchoolClass(), year).stream()
                .map(SubjectAssignmentResponse::from)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Új hozzárendelés (osztály + tárgy + tanár + év)")
    public ResponseEntity<SubjectAssignmentResponse> create(@Valid @RequestBody SubjectAssignmentCreateRequest req) {
        SchoolClass cls = classes.findById(req.schoolClassId())
                .orElseThrow(() -> NotFoundException.of("SchoolClass", req.schoolClassId()));
        Subject sub = subjects.findById(req.subjectId())
                .orElseThrow(() -> NotFoundException.of("Subject", req.subjectId()));
        AppUser teacher = users.findById(req.teacherId())
                .orElseThrow(() -> NotFoundException.of("AppUser", req.teacherId()));
        if (teacher.getRole() != Role.OKTATO) {
            throw new ConflictException("User " + teacher.getEmail() + " is not an OKTATO");
        }
        SubjectAssignment saved = assignments.save(SubjectAssignment.builder()
                .schoolClass(cls)
                .subject(sub)
                .teacher(teacher)
                .year(req.year())
                .build());
        return ResponseEntity.status(201).body(SubjectAssignmentResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hozzárendelés törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        SubjectAssignment a = assignments.findById(id)
                .orElseThrow(() -> NotFoundException.of("SubjectAssignment", id));
        assignments.delete(a);
        return ResponseEntity.noContent().build();
    }
}
