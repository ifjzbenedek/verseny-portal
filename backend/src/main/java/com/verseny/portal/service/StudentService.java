package com.verseny.portal.service;

import com.verseny.portal.dto.StudentDtos.StudentCreateRequest;
import com.verseny.portal.dto.StudentDtos.StudentResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StudentService {

    private final StudentRepository students;
    private final UserRepository users;
    private final SchoolClassRepository classes;
    private final CurrentUser currentUser;

    public StudentService(StudentRepository students, UserRepository users,
                          SchoolClassRepository classes, CurrentUser currentUser) {
        this.students = students;
        this.users = users;
        this.classes = classes;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> list(Pageable pageable) {
        return students.findAll(pageable).map(StudentResponse::from);
    }

    @Transactional(readOnly = true)
    public StudentResponse me() {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        return StudentResponse.from(s);
    }

    @Transactional(readOnly = true)
    public StudentResponse get(Long id) {
        Student s = find(id);
        AppUser me = currentUser.require();
        if (me.getRole() == Role.HALLGATO && !s.getUser().getId().equals(me.getId())) {
            throw new AuthorizationException("Students can only access their own profile");
        }
        return StudentResponse.from(s);
    }

    public StudentResponse create(StudentCreateRequest req) {
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
        return StudentResponse.from(saved);
    }

    public void delete(Long id) {
        students.delete(find(id));
    }

    private Student find(Long id) {
        return students.findById(id).orElseThrow(() -> NotFoundException.of("Student", id));
    }
}
