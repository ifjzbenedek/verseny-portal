package com.verseny.portal.controller;

import com.verseny.portal.dto.StudentDtos.*;
import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Role;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.UserRepository;
import com.verseny.portal.security.CurrentUser;
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

    private final StudentRepository students;
    private final UserRepository users;
    private final SchoolClassRepository classes;
    private final CurrentUser currentUser;

    public StudentController(StudentRepository students, UserRepository users,
                             SchoolClassRepository classes, CurrentUser currentUser) {
        this.students = students;
        this.users = users;
        this.classes = classes;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Hallgatók lapozható listája")
    public Page<StudentResponse> list(Pageable pageable) {
        return students.findAll(pageable).map(StudentResponse::from);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját hallgatói profil")
    public StudentResponse me() {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        return StudentResponse.from(s);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO','HALLGATO')")
    @Operation(summary = "Egy hallgató lekérdezése")
    public StudentResponse get(@PathVariable Long id) {
        Student s = find(id);
        AppUser me = currentUser.require();
        if (me.getRole() == Role.HALLGATO && !s.getUser().getId().equals(me.getId())) {
            throw new AuthorizationException("Students can only access their own profile");
        }
        return StudentResponse.from(s);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hallgató felvétele osztályba")
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentCreateRequest req) {
        AppUser user = users.findById(req.userId())
                .orElseThrow(() -> NotFoundException.of("AppUser", req.userId()));
        if (user.getRole() != Role.HALLGATO) {
            throw new ConflictException("User " + user.getEmail() + " is not a HALLGATO");
        }
        students.findByUser(user).ifPresent(s -> {
            throw new ConflictException("User " + user.getEmail() + " is already a student");
        });
        SchoolClass cls = classes.findById(req.schoolClassId())
                .orElseThrow(() -> NotFoundException.of("SchoolClass", req.schoolClassId()));
        Student saved = students.save(Student.builder().user(user).schoolClass(cls).build());
        return ResponseEntity.status(201).body(StudentResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Hallgató törlése")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Student s = find(id);
        students.delete(s);
        return ResponseEntity.noContent().build();
    }

    private Student find(Long id) {
        return students.findById(id).orElseThrow(() -> NotFoundException.of("Student", id));
    }
}
