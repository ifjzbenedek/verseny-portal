package com.verseny.portal.repository;

import com.verseny.portal.model.Event;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase
class EventRepositoryTest {

    @Autowired EventRepository events;

    @Test
    void saveAndFindAll_assignsId() {
        Event e = events.save(Event.builder()
                .title("Saved")
                .startAt(LocalDateTime.of(2026, 5, 25, 9, 0))
                .build());

        assertThat(e.getId()).isNotNull();
        assertThat(events.findAll()).hasSize(1);
    }

    @Test
    void findAllByOrderByStartAtAsc_sortsAscending() {
        events.save(Event.builder().title("B").startAt(LocalDateTime.of(2026, 6, 1, 10, 0)).build());
        events.save(Event.builder().title("A").startAt(LocalDateTime.of(2026, 5, 1, 10, 0)).build());
        events.save(Event.builder().title("C").startAt(LocalDateTime.of(2026, 7, 1, 10, 0)).build());

        List<Event> sorted = events.findAllByOrderByStartAtAsc();

        assertThat(sorted).extracting(Event::getTitle).containsExactly("A", "B", "C");
    }

    @Test
    void delete_removesEvent() {
        Event saved = events.save(Event.builder()
                .title("To delete")
                .startAt(LocalDateTime.of(2026, 8, 1, 10, 0))
                .build());

        events.delete(saved);

        assertThat(events.findById(saved.getId())).isEmpty();
    }
}
