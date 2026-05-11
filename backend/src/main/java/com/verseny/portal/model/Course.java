package com.verseny.portal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private Integer credits;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private AppUser instructor;
}
