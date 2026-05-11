package com.verseny.portal.service;

import com.verseny.portal.dto.SubjectDtos.SubjectCreateRequest;
import com.verseny.portal.dto.SubjectDtos.SubjectResponse;
import com.verseny.portal.dto.SubjectDtos.SubjectUpdateRequest;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.Subject;
import com.verseny.portal.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SubjectService {

    private final SubjectRepository subjects;

    public SubjectService(SubjectRepository subjects) {
        this.subjects = subjects;
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> list() {
        return subjects.findAll().stream().map(SubjectResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SubjectResponse get(Long id) {
        return SubjectResponse.from(find(id));
    }

    public SubjectResponse create(SubjectCreateRequest req) {
        Subject saved = subjects.save(Subject.builder()
                .name(req.name())
                .description(req.description())
                .requiredBook(req.requiredBook())
                .lessonsJson(req.lessonsJson())
                .build());
        return SubjectResponse.from(saved);
    }

    public SubjectResponse update(Long id, SubjectUpdateRequest req) {
        Subject s = find(id);
        s.setName(req.name());
        s.setDescription(req.description());
        s.setRequiredBook(req.requiredBook());
        s.setLessonsJson(req.lessonsJson());
        return SubjectResponse.from(subjects.save(s));
    }

    public void delete(Long id) {
        subjects.delete(find(id));
    }

    private Subject find(Long id) {
        return subjects.findById(id).orElseThrow(() -> NotFoundException.of("Subject", id));
    }
}
