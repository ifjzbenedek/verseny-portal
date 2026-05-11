package com.verseny.portal.repository;

import com.verseny.portal.model.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    Optional<SchoolClass> findByStartYearAndIdentifier(Integer startYear, String identifier);
}
