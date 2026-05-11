package com.verseny.portal.controller;

import com.verseny.portal.model.Course;
import com.verseny.portal.repository.CourseRepository;
import com.verseny.portal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courses;
    private final UserRepository users;

    public CourseController(CourseRepository courses, UserRepository users) {
        this.courses = courses;
        this.users = users;
    }

    @GetMapping
    public List<Course> list() {
        return courses.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> get(@PathVariable Long id) {
        return courses.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OKTATO')")
    public Course create(@RequestBody Course in, Authentication auth) {
        users.findByEmail(auth.getName()).ifPresent(in::setInstructor);
        in.setId(null);
        return courses.save(in);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OKTATO')")
    public ResponseEntity<Course> update(@PathVariable Long id, @RequestBody Course in) {
        return courses.findById(id).map(existing -> {
            existing.setCode(in.getCode());
            existing.setTitle(in.getTitle());
            existing.setDescription(in.getDescription());
            existing.setCredits(in.getCredits());
            return ResponseEntity.ok(courses.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!courses.existsById(id)) return ResponseEntity.notFound().build();
        courses.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
