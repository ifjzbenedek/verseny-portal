package com.verseny.portal.service;

import com.verseny.portal.dto.ScheduleDtos.ScheduleSlotCreateRequest;
import com.verseny.portal.dto.ScheduleDtos.ScheduleSlotResponse;
import com.verseny.portal.exception.ConflictException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.ScheduleSlot;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.ScheduleSlotRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import com.verseny.portal.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ScheduleService {

    private final ScheduleSlotRepository slots;
    private final SubjectAssignmentRepository assignments;
    private final StudentRepository students;
    private final CurrentUser currentUser;

    public ScheduleService(ScheduleSlotRepository slots,
                           SubjectAssignmentRepository assignments,
                           StudentRepository students,
                           CurrentUser currentUser) {
        this.slots = slots;
        this.assignments = assignments;
        this.students = students;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> myClassSchedule() {
        AppUser me = currentUser.require();
        Student s = students.findByUser(me)
                .orElseThrow(() -> new NotFoundException("No student profile for user " + me.getEmail()));
        return slots.findByAssignment_SchoolClass(s.getSchoolClass()).stream()
                .sorted(slotOrder())
                .map(ScheduleSlotResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> myTeachingSchedule() {
        AppUser me = currentUser.require();
        return slots.findByAssignment_Teacher(me).stream()
                .sorted(slotOrder())
                .map(ScheduleSlotResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> all() {
        return slots.findAll().stream()
                .sorted(slotOrder())
                .map(ScheduleSlotResponse::from)
                .toList();
    }

    public ScheduleSlotResponse create(ScheduleSlotCreateRequest req) {
        SubjectAssignment a = assignments.findById(req.assignmentId())
                .orElseThrow(() -> NotFoundException.of("SubjectAssignment", req.assignmentId()));
        if (!req.endTime().isAfter(req.startTime())) {
            throw new ConflictException("endTime must be after startTime");
        }
        ScheduleSlot saved = slots.save(ScheduleSlot.builder()
                .assignment(a)
                .dayOfWeek(req.dayOfWeek())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .room(req.room())
                .build());
        return ScheduleSlotResponse.from(saved);
    }

    public void delete(Long id) {
        ScheduleSlot s = slots.findById(id).orElseThrow(() -> NotFoundException.of("ScheduleSlot", id));
        slots.delete(s);
    }

    private static Comparator<ScheduleSlot> slotOrder() {
        return Comparator
                .comparing((ScheduleSlot x) -> x.getDayOfWeek())
                .thenComparing(ScheduleSlot::getStartTime);
    }
}
