package com.verseny.portal;

import com.verseny.portal.model.ScheduleSlot;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.ScheduleSlotRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Configuration
public class ScheduleSeeder {

    private static final Logger log = LoggerFactory.getLogger(ScheduleSeeder.class);

    @Bean
    @Order(50)
    public CommandLineRunner seedSchedule(ScheduleSlotRepository slots,
                                          SubjectAssignmentRepository assignments) {
        return args -> {
            if (slots.count() > 0) {
                log.debug("ScheduleSeeder skipped (already has {} slots)", slots.count());
                return;
            }
            int year = LocalDate.now().getYear();
            List<SubjectAssignment> aList = assignments.findByYear(year);
            if (aList.size() < 6) {
                log.warn("ScheduleSeeder skipped: expected >=6 assignments for year {}, found {}",
                        year, aList.size());
                return;
            }
            aList.sort((a, b) -> {
                int c = Long.compare(a.getSchoolClass().getId(), b.getSchoolClass().getId());
                if (c != 0) return c;
                return Long.compare(a.getSubject().getId(), b.getSubject().getId());
            });

            SubjectAssignment aMatekA = aList.get(0);
            SubjectAssignment aTortiA = aList.get(1);
            SubjectAssignment aMagyarA = aList.get(2);
            SubjectAssignment aMatekB = aList.get(3);
            SubjectAssignment aTortiB = aList.get(4);
            SubjectAssignment aMagyarB = aList.get(5);

            save(slots, aMatekA,  DayOfWeek.MONDAY,    LocalTime.of(8, 0),  LocalTime.of(9, 0),  "101");
            save(slots, aMatekA,  DayOfWeek.WEDNESDAY, LocalTime.of(10, 0), LocalTime.of(11, 0), "101");
            save(slots, aTortiA,  DayOfWeek.TUESDAY,   LocalTime.of(9, 0),  LocalTime.of(10, 0), "102");
            save(slots, aTortiA,  DayOfWeek.THURSDAY,  LocalTime.of(11, 0), LocalTime.of(12, 0), "102");
            save(slots, aMagyarA, DayOfWeek.MONDAY,    LocalTime.of(11, 0), LocalTime.of(12, 0), "103");
            save(slots, aMagyarA, DayOfWeek.FRIDAY,    LocalTime.of(9, 0),  LocalTime.of(10, 0), "103");

            save(slots, aMatekB,  DayOfWeek.TUESDAY,   LocalTime.of(8, 0),  LocalTime.of(9, 0),  "201");
            save(slots, aMatekB,  DayOfWeek.THURSDAY,  LocalTime.of(10, 0), LocalTime.of(11, 0), "201");
            save(slots, aTortiB,  DayOfWeek.WEDNESDAY, LocalTime.of(9, 0),  LocalTime.of(10, 0), "202");
            save(slots, aTortiB,  DayOfWeek.FRIDAY,    LocalTime.of(11, 0), LocalTime.of(12, 0), "202");
            save(slots, aMagyarB, DayOfWeek.MONDAY,    LocalTime.of(13, 0), LocalTime.of(14, 0), "203");
            save(slots, aMagyarB, DayOfWeek.THURSDAY,  LocalTime.of(13, 0), LocalTime.of(14, 0), "203");

            log.info("ScheduleSeeder finished. slots={}", slots.count());
        };
    }

    private void save(ScheduleSlotRepository slots, SubjectAssignment a,
                      DayOfWeek day, LocalTime start, LocalTime end, String room) {
        slots.save(ScheduleSlot.builder()
                .assignment(a)
                .dayOfWeek(day)
                .startTime(start)
                .endTime(end)
                .room(room)
                .build());
    }
}
