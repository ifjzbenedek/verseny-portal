package com.verseny.portal.dto;

import com.verseny.portal.dto.EventDtos.EventResponse;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Event;
import com.verseny.portal.model.Role;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EventResponseTest {

    @Test
    void from_mapsAllFieldsIncludingLatLng() {
        AppUser admin = AppUser.builder().id(1L).email("a@p.hu").fullName("Admin").role(Role.ADMIN).build();
        LocalDateTime start = LocalDateTime.of(2026, 6, 15, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 15, 12, 0);
        LocalDateTime created = LocalDateTime.of(2026, 5, 1, 8, 0);

        Event e = Event.builder()
                .id(10L)
                .title("Tanévzáró")
                .description("Az iskolaév lezárása.")
                .startAt(start)
                .endAt(end)
                .location("Aula")
                .latitude(47.4979)
                .longitude(19.0402)
                .createdBy(admin)
                .createdAt(created)
                .build();

        EventResponse r = EventResponse.from(e);

        assertThat(r.id()).isEqualTo(10L);
        assertThat(r.title()).isEqualTo("Tanévzáró");
        assertThat(r.description()).isEqualTo("Az iskolaév lezárása.");
        assertThat(r.startAt()).isEqualTo(start);
        assertThat(r.endAt()).isEqualTo(end);
        assertThat(r.location()).isEqualTo("Aula");
        assertThat(r.latitude()).isEqualTo(47.4979);
        assertThat(r.longitude()).isEqualTo(19.0402);
        assertThat(r.createdByFullName()).isEqualTo("Admin");
        assertThat(r.createdAt()).isEqualTo(created);
    }

    @Test
    void from_nullCreatedBy_yieldsNullCreatedByFullName() {
        Event e = Event.builder()
                .id(1L)
                .title("Anonymous event")
                .startAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        EventResponse r = EventResponse.from(e);

        assertThat(r.createdByFullName()).isNull();
        assertThat(r.title()).isEqualTo("Anonymous event");
    }

    @Test
    void from_preservesNullableOptionalFields() {
        Event e = Event.builder()
                .id(2L)
                .title("Minimal")
                .startAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .createdAt(LocalDateTime.of(2026, 1, 1, 8, 0))
                .build();

        EventResponse r = EventResponse.from(e);

        assertThat(r.description()).isNull();
        assertThat(r.endAt()).isNull();
        assertThat(r.location()).isNull();
        assertThat(r.latitude()).isNull();
        assertThat(r.longitude()).isNull();
    }
}
