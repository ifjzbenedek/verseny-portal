package com.verseny.portal.repository;

import com.verseny.portal.model.Grade;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.Subject;
import com.verseny.portal.model.SubjectAssignment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GradeRepository extends JpaRepository<Grade, Long> {

    @EntityGraph(attributePaths = {
            "student", "student.user", "student.schoolClass",
            "assignment", "assignment.subject", "assignment.schoolClass", "assignment.teacher",
            "recordedBy"
    })
    List<Grade> findByStudent(Student student);

    List<Grade> findByStudentAndAssignment(Student student, SubjectAssignment assignment);

    @EntityGraph(attributePaths = {
            "student", "student.user", "student.schoolClass",
            "assignment", "assignment.subject", "assignment.schoolClass", "assignment.teacher",
            "recordedBy"
    })
    @Query("""
            SELECT g FROM Grade g
            WHERE g.student.schoolClass = :schoolClass
              AND g.assignment.subject = :subject
            """)
    List<Grade> findByClassAndSubject(@Param("schoolClass") SchoolClass schoolClass,
                                      @Param("subject") Subject subject);
}
