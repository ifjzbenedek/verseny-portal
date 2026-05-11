package com.verseny.portal.repository;

import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(AppUser user);
    List<Student> findBySchoolClass(SchoolClass schoolClass);
}
