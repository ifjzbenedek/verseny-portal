package com.verseny.portal.dto;

import com.verseny.portal.model.SubjectAssignment;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SubjectAssignmentDtos {

    public record SubjectAssignmentResponse(
            Long id,
            Long schoolClassId,
            String schoolClassName,
            Long subjectId,
            String subjectName,
            Long teacherId,
            String teacherName,
            Integer year
    ) {
        public static SubjectAssignmentResponse from(SubjectAssignment a) {
            String className = a.getSchoolClass() == null ? null
                    : a.getSchoolClass().getStartYear() + "/" + a.getSchoolClass().getIdentifier();
            return new SubjectAssignmentResponse(
                    a.getId(),
                    a.getSchoolClass() == null ? null : a.getSchoolClass().getId(),
                    className,
                    a.getSubject() == null ? null : a.getSubject().getId(),
                    a.getSubject() == null ? null : a.getSubject().getName(),
                    a.getTeacher() == null ? null : a.getTeacher().getId(),
                    a.getTeacher() == null ? null : a.getTeacher().getFullName(),
                    a.getYear()
            );
        }
    }

    public record SubjectAssignmentCreateRequest(
            @NotNull Long schoolClassId,
            @NotNull Long subjectId,
            @NotNull Long teacherId,
            @NotNull @Min(2000) @Max(2100) Integer year
    ) {}
}
