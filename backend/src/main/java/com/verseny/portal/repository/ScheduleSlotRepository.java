package com.verseny.portal.repository;

import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.ScheduleSlot;
import com.verseny.portal.model.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {
    List<ScheduleSlot> findByAssignment_SchoolClass(SchoolClass schoolClass);
    List<ScheduleSlot> findByAssignment_Teacher(AppUser teacher);
}
