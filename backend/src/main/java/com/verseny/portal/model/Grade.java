package com.verseny.portal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grade")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Grade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private SubjectAssignment assignment;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GradeType type;

    @Builder.Default
    @Column(nullable = false)
    private Double weight = 1.0;

    @Column(length = 1000)
    private String comment;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recorded_by", nullable = false)
    private AppUser recordedBy;

    @Version
    private Long version;

    @PrePersist
    void prePersist() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
        if (weight == null) weight = 1.0;
        if (type == null) type = GradeType.NORMAL;
    }
}
