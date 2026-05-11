package com.verseny.portal.dto;

import com.verseny.portal.model.Student;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class StudentDtos {

    public record StudentResponse(
            Long id,
            Long userId,
            String email,
            String fullName,
            Long schoolClassId,
            String schoolClassName,
            LocalDateTime enrolledAt
    ) {
        public static StudentResponse from(Student s) {
            String className = s.getSchoolClass() == null ? null
                    : s.getSchoolClass().getStartYear() + "/" + s.getSchoolClass().getIdentifier();
            return new StudentResponse(
                    s.getId(),
                    s.getUser() == null ? null : s.getUser().getId(),
                    s.getUser() == null ? null : s.getUser().getEmail(),
                    s.getUser() == null ? null : s.getUser().getFullName(),
                    s.getSchoolClass() == null ? null : s.getSchoolClass().getId(),
                    className,
                    s.getEnrolledAt()
            );
        }
    }

    public record StudentCreateRequest(
            @NotNull Long userId,
            @NotNull Long schoolClassId
    ) {}
}
