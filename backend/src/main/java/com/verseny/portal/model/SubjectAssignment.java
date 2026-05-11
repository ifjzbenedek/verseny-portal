package com.verseny.portal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subject_assignment", uniqueConstraints = {
        @UniqueConstraint(
                name = "uk_assignment_class_subject_year",
                columnNames = {"school_class_id", "subject_id", "year"}
        )
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubjectAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "school_class_id", nullable = false)
    private SchoolClass schoolClass;

    @ManyToOne(optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private AppUser teacher;

    @Column(nullable = false)
    private Integer year;
}
