package com.verseny.portal.repository;

import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.SubjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectAssignmentRepository extends JpaRepository<SubjectAssignment, Long> {
    List<SubjectAssignment> findByTeacher(AppUser teacher);
    List<SubjectAssignment> findBySchoolClassAndYear(SchoolClass schoolClass, Integer year);
    List<SubjectAssignment> findByYear(Integer year);
    List<SubjectAssignment> findBySchoolClass(SchoolClass schoolClass);
}
