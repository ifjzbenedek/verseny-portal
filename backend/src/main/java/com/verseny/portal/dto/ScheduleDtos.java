package com.verseny.portal.dto;

import com.verseny.portal.model.ScheduleSlot;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.DayOfWeek;
import java.time.LocalTime;

public class ScheduleDtos {

    public record ScheduleSlotResponse(
            Long id,
            Long assignmentId,
            Long subjectId,
            String subjectName,
            Long schoolClassId,
            String className,
            Long teacherId,
            String teacherName,
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            String room
    ) {
        public static ScheduleSlotResponse from(ScheduleSlot s) {
            var a = s.getAssignment();
            var cls = a == null ? null : a.getSchoolClass();
            var sub = a == null ? null : a.getSubject();
            var tea = a == null ? null : a.getTeacher();
            String className = cls == null ? null : cls.getStartYear() + "/" + cls.getIdentifier();
            return new ScheduleSlotResponse(
                    s.getId(),
                    a == null ? null : a.getId(),
                    sub == null ? null : sub.getId(),
                    sub == null ? null : sub.getName(),
                    cls == null ? null : cls.getId(),
                    className,
                    tea == null ? null : tea.getId(),
                    tea == null ? null : tea.getFullName(),
                    s.getDayOfWeek(),
                    s.getStartTime(),
                    s.getEndTime(),
                    s.getRoom()
            );
        }
    }

    public record ScheduleSlotCreateRequest(
            @NotNull Long assignmentId,
            @NotNull DayOfWeek dayOfWeek,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            @NotBlank @Size(max = 64) String room
    ) {}
}
