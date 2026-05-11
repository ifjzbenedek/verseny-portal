package com.verseny.portal.dto;

import com.verseny.portal.model.Grade;
import com.verseny.portal.model.GradeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class GradeDtos {

    public record GradeResponse(
            Long id,
            Long studentId,
            String studentName,
            Long assignmentId,
            String subjectName,
            String schoolClassName,
            Integer value,
            GradeType type,
            Double weight,
            String comment,
            LocalDateTime recordedAt,
            Long recordedById,
            String recordedByName
    ) {
        public static GradeResponse from(Grade g) {
            var s = g.getStudent();
            var a = g.getAssignment();
            String studentName = s == null || s.getUser() == null ? null : s.getUser().getFullName();
            String subjectName = a == null || a.getSubject() == null ? null : a.getSubject().getName();
            String className = a == null || a.getSchoolClass() == null ? null
                    : a.getSchoolClass().getStartYear() + "/" + a.getSchoolClass().getIdentifier();
            return new GradeResponse(
                    g.getId(),
                    s == null ? null : s.getId(),
                    studentName,
                    a == null ? null : a.getId(),
                    subjectName,
                    className,
                    g.getValue(),
                    g.getType(),
                    g.getWeight(),
                    g.getComment(),
                    g.getRecordedAt(),
                    g.getRecordedBy() == null ? null : g.getRecordedBy().getId(),
                    g.getRecordedBy() == null ? null : g.getRecordedBy().getFullName()
            );
        }
    }

    public record GradeCreateRequest(
            @NotNull Long studentId,
            @NotNull Long assignmentId,
            @NotNull @Min(1) @Max(5) Integer value,
            @NotNull GradeType type,
            @NotNull @DecimalMin("0.1") Double weight,
            @Size(max = 1000) String comment
    ) {}

    public record GradeUpdateRequest(
            @NotNull @Min(1) @Max(5) Integer value,
            @NotNull GradeType type,
            @NotNull @DecimalMin("0.1") Double weight,
            @Size(max = 1000) String comment
    ) {}

    public record SubjectAverageEntry(
            Long studentId,
            String studentName,
            Double weightedAverage,
            Integer gradeCount
    ) {}

    public record ClassSubjectAverageResponse(
            Long schoolClassId,
            String schoolClassName,
            Long subjectId,
            String subjectName,
            Double classWeightedAverage,
            java.util.List<SubjectAverageEntry> perStudent
    ) {}
}
