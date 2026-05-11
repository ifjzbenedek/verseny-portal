package com.verseny.portal.service;

import com.verseny.portal.dto.SchoolClassDtos.SchoolClassCreateRequest;
import com.verseny.portal.dto.SchoolClassDtos.SchoolClassResponse;
import com.verseny.portal.dto.SchoolClassDtos.SchoolClassUpdateRequest;
import com.verseny.portal.dto.StudentDtos.StudentResponse;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SchoolClassService {

    private final SchoolClassRepository classes;
    private final StudentRepository students;

    public SchoolClassService(SchoolClassRepository classes, StudentRepository students) {
        this.classes = classes;
        this.students = students;
    }

    @Transactional(readOnly = true)
    public List<SchoolClassResponse> list() {
        return classes.findAll().stream().map(SchoolClassResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SchoolClassResponse get(Long id) {
        return SchoolClassResponse.from(find(id));
    }

    public SchoolClassResponse create(SchoolClassCreateRequest req) {
        classes.findByStartYearAndIdentifier(req.startYear(), req.identifier()).ifPresent(c -> {
            throw new ConflictException("Class " + req.startYear() + "/" + req.identifier() + " already exists");
        });
        SchoolClass saved = classes.save(SchoolClass.builder()
                .startYear(req.startYear())
                .identifier(req.identifier())
                .build());
        return SchoolClassResponse.from(saved);
    }

    public SchoolClassResponse update(Long id, SchoolClassUpdateRequest req) {
        SchoolClass c = find(id);
        c.setStartYear(req.startYear());
        c.setIdentifier(req.identifier());
        return SchoolClassResponse.from(classes.save(c));
    }

    public void delete(Long id) {
        classes.delete(find(id));
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> studentsOf(Long id) {
        SchoolClass c = find(id);
        return students.findBySchoolClass(c).stream().map(StudentResponse::from).toList();
    }

    private SchoolClass find(Long id) {
        return classes.findById(id).orElseThrow(() -> NotFoundException.of("SchoolClass", id));
    }
}
