package com.verseny.portal.controller;

import com.verseny.portal.dto.GradeDtos.*;
import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Grade;
import com.verseny.portal.model.Role;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.Subject;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.GradeRepository;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import com.verseny.portal.repository.SubjectRepository;
import com.verseny.portal.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grades")
@Tag(name = "Grades", description = "Jegyek kezelése")
public class GradeController {

    private final GradeRepository grades;
    private final StudentRepository students;
    private final SubjectAssignmentRepository assignments;
    private final SubjectRepository subjects;
    private final SchoolClassRepository classes;
    private final CurrentUser currentUser;

    public GradeController(GradeRepository grades,
                           StudentRepository students,
                           SubjectAssignmentRepository assignments,
                           SubjectRepository subjects,
                           SchoolClassRepository classes,
                           CurrentUser currentUser) {
        this.grades = grades;
        this.students = students;
        this.assignments = assignments;
        this.subjects = subjects;
        this.classes = classes;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('HALLGATO')")
    @Operation(summary = "Saját jegyek, opcionális subjectId szűréssel")
    public List<GradeResponse> myGrades(@RequestParam(required = false) Long subjectId) {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        return grades.findByStudent(s).stream()
                .filter(g -> subjectId == null
                        || (g.getAssignment() != null
                            && g.getAssignment().getSubject() != null
                            && g.getAssignment().getSubject().getId().equals(subjectId)))
                .map(GradeResponse::from)
                .toList();
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Egy diák jegyei (OKTATO csak saját tárgy, ADMIN mindent)")
    public List<GradeResponse> ofStudent(@PathVariable Long studentId) {
        Student s = students.findById(studentId).orElseThrow(() -> NotFoundException.of("Student", studentId));
        AppUser me = currentUser.require();
        List<Grade> all = grades.findByStudent(s);
        if (me.getRole() == Role.OKTATO) {
            return all.stream()
                    .filter(g -> g.getAssignment() != null
                            && g.getAssignment().getTeacher() != null
                            && g.getAssignment().getTeacher().getId().equals(me.getId()))
                    .map(GradeResponse::from)
                    .toList();
        }
        return all.stream().map(GradeResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Új jegy beírása (csak a saját assignment-be)")
    public ResponseEntity<GradeResponse> create(@Valid @RequestBody GradeCreateRequest req) {
        AppUser me = currentUser.require();
        Student s = students.findById(req.studentId())
                .orElseThrow(() -> NotFoundException.of("Student", req.studentId()));
        SubjectAssignment a = assignments.findById(req.assignmentId())
                .orElseThrow(() -> NotFoundException.of("SubjectAssignment", req.assignmentId()));
        if (a.getTeacher() == null || !a.getTeacher().getId().equals(me.getId())) {
            throw new AuthorizationException("OKTATO can only grade own assignments");
        }
        if (s.getSchoolClass() == null || a.getSchoolClass() == null
                || !s.getSchoolClass().getId().equals(a.getSchoolClass().getId())) {
            throw new AuthorizationException("Student is not in the class of this assignment");
        }
        Grade g = Grade.builder()
                .student(s)
                .assignment(a)
                .value(req.value())
                .type(req.type())
                .weight(req.weight())
                .comment(req.comment())
                .recordedBy(me)
                .build();
        return ResponseEntity.status(201).body(GradeResponse.from(grades.save(g)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OKTATO')")
    @Operation(summary = "Jegy módosítása (csak ha saját assignment)")
    public GradeResponse update(@PathVariable Long id, @Valid @RequestBody GradeUpdateRequest req) {
        Grade g = grades.findById(id).orElseThrow(() -> NotFoundException.of("Grade", id));
        AppUser me = currentUser.require();
        if (g.getAssignment() == null || g.getAssignment().getTeacher() == null
                || !g.getAssignment().getTeacher().getId().equals(me.getId())) {
            throw new AuthorizationException("OKTATO can only modify own grades");
        }
        g.setValue(req.value());
        g.setType(req.type());
        g.setWeight(req.weight());
        g.setComment(req.comment());
        return GradeResponse.from(grades.save(g));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Jegy törlése (OKTATO csak sajátját)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Grade g = grades.findById(id).orElseThrow(() -> NotFoundException.of("Grade", id));
        AppUser me = currentUser.require();
        if (me.getRole() == Role.OKTATO) {
            if (g.getAssignment() == null || g.getAssignment().getTeacher() == null
                    || !g.getAssignment().getTeacher().getId().equals(me.getId())) {
                throw new AuthorizationException("OKTATO can only delete own grades");
            }
        }
        grades.delete(g);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/class/{classId}/subject/{subjectId}/average")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN','OKTATO')")
    @Operation(summary = "Osztály+tárgy súlyozott átlagai diákonként")
    public ClassSubjectAverageResponse classSubjectAverage(@PathVariable Long classId, @PathVariable Long subjectId) {
        SchoolClass cls = classes.findById(classId).orElseThrow(() -> NotFoundException.of("SchoolClass", classId));
        Subject sub = subjects.findById(subjectId).orElseThrow(() -> NotFoundException.of("Subject", subjectId));

        List<Grade> all = grades.findByClassAndSubject(cls, sub);

        Map<Long, List<Grade>> byStudent = new LinkedHashMap<>();
        for (Grade g : all) {
            if (g.getStudent() == null) continue;
            byStudent.computeIfAbsent(g.getStudent().getId(), k -> new ArrayList<>()).add(g);
        }

        List<SubjectAverageEntry> perStudent = new ArrayList<>();
        double classWeightedSum = 0;
        double classWeightTotal = 0;
        int classCount = 0;

        for (var entry : byStudent.entrySet()) {
            List<Grade> gs = entry.getValue();
            double ws = 0, wt = 0;
            String name = null;
            for (Grade g : gs) {
                double w = g.getWeight() == null ? 1.0 : g.getWeight();
                ws += w * g.getValue();
                wt += w;
                if (name == null && g.getStudent() != null && g.getStudent().getUser() != null) {
                    name = g.getStudent().getUser().getFullName();
                }
            }
            double avg = wt == 0 ? 0 : ws / wt;
            perStudent.add(new SubjectAverageEntry(entry.getKey(), name, round2(avg), gs.size()));
            classWeightedSum += ws;
            classWeightTotal += wt;
            classCount += gs.size();
        }

        Double classAvg = classWeightTotal == 0 ? null : round2(classWeightedSum / classWeightTotal);

        return new ClassSubjectAverageResponse(
                cls.getId(),
                cls.getStartYear() + "/" + cls.getIdentifier(),
                sub.getId(),
                sub.getName(),
                classAvg,
                perStudent
        );
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
