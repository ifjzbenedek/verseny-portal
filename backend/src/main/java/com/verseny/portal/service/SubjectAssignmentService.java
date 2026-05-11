package com.verseny.portal.service;

import com.verseny.portal.dto.SubjectAssignmentDtos.SubjectAssignmentCreateRequest;
import com.verseny.portal.dto.SubjectAssignmentDtos.SubjectAssignmentResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class SubjectAssignmentService {

    private final SubjectAssignmentRepository assignments;
    private final SchoolClassRepository classes;
    private final SubjectRepository subjects;
    private final UserRepository users;
    private final StudentRepository students;
    private final CurrentUser currentUser;

    public SubjectAssignmentService(SubjectAssignmentRepository assignments,
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

    @Transactional(readOnly = true)
    public List<SubjectAssignmentResponse> list(Integer year, Long classId, Long teacherId) {
        return assignments.findAll().stream()
                .filter(a -> year == null || a.getYear().equals(year))
                .filter(a -> classId == null || (a.getSchoolClass() != null && a.getSchoolClass().getId().equals(classId)))
                .filter(a -> teacherId == null || (a.getTeacher() != null && a.getTeacher().getId().equals(teacherId)))
                .map(SubjectAssignmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubjectAssignmentResponse> myTeaching() {
        AppUser me = currentUser.require();
        int year = LocalDate.now().getYear();
        return assignments.findByTeacher(me).stream()
                .filter(a -> a.getYear() != null && a.getYear() == year)
                .map(SubjectAssignmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubjectAssignmentResponse> mySubjects() {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        int year = LocalDate.now().getYear();
        return assignments.findBySchoolClassAndYear(s.getSchoolClass(), year).stream()
                .map(SubjectAssignmentResponse::from)
                .toList();
    }

    public SubjectAssignmentResponse create(SubjectAssignmentCreateRequest req) {
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
        return SubjectAssignmentResponse.from(saved);
    }

    public void delete(Long id) {
        SubjectAssignment a = assignments.findById(id)
                .orElseThrow(() -> NotFoundException.of("SubjectAssignment", id));
        assignments.delete(a);
    }
}
