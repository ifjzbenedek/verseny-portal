package com.verseny.portal.service;

import com.verseny.portal.dto.EventDtos.EventCreateRequest;
import com.verseny.portal.dto.EventDtos.EventResponse;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Event;
import com.verseny.portal.model.Role;
import com.verseny.portal.repository.EventRepository;
import com.verseny.portal.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock EventRepository events;
    @Mock CurrentUser currentUser;
    @InjectMocks EventService service;

    AppUser admin;

    @BeforeEach
    void setup() {
        admin = AppUser.builder().id(42L).email("admin@p.hu").fullName("Admin").role(Role.ADMIN).build();
    }

    @Test
    void listAll_mapsRepositoryResultsInOrder() {
        Event a = Event.builder().id(1L).title("a")
                .startAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .createdAt(LocalDateTime.now()).build();
        Event b = Event.builder().id(2L).title("b")
                .startAt(LocalDateTime.of(2026, 2, 1, 9, 0))
                .createdAt(LocalDateTime.now()).build();
        when(events.findAllByOrderByStartAtAsc()).thenReturn(List.of(a, b));

        List<EventResponse> result = service.listAll();

        assertThat(result).extracting(EventResponse::title).containsExactly("a", "b");
    }

    @Test
    void create_setsCreatedByFromCurrentUserAndSavesEntity() {
        when(currentUser.require()).thenReturn(admin);
        when(events.save(any(Event.class))).thenAnswer(inv -> {
            Event saved = inv.getArgument(0);
            saved.setId(99L);
            return saved;
        });
        EventCreateRequest req = new EventCreateRequest(
                "Sportnap", "leírás",
                LocalDateTime.of(2026, 5, 25, 9, 0),
                LocalDateTime.of(2026, 5, 25, 14, 0),
                "Pálya", 47.5, 19.0);

        EventResponse response = service.create(req);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(events).save(captor.capture());
        Event persisted = captor.getValue();
        assertThat(persisted.getCreatedBy()).isSameAs(admin);
        assertThat(persisted.getTitle()).isEqualTo("Sportnap");
        assertThat(persisted.getLatitude()).isEqualTo(47.5);
        assertThat(persisted.getLongitude()).isEqualTo(19.0);
        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.createdByFullName()).isEqualTo("Admin");
    }

    @Test
    void create_passesThroughAllFields() {
        when(currentUser.require()).thenReturn(admin);
        when(events.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        EventCreateRequest req = new EventCreateRequest(
                "T", "D",
                LocalDateTime.of(2026, 5, 20, 18, 0),
                null, "Helyszín", null, null);

        service.create(req);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(events).save(captor.capture());
        Event persisted = captor.getValue();
        assertThat(persisted.getDescription()).isEqualTo("D");
        assertThat(persisted.getStartAt()).isEqualTo(LocalDateTime.of(2026, 5, 20, 18, 0));
        assertThat(persisted.getEndAt()).isNull();
        assertThat(persisted.getLocation()).isEqualTo("Helyszín");
        assertThat(persisted.getLatitude()).isNull();
        assertThat(persisted.getLongitude()).isNull();
    }

    @Test
    void delete_existingId_deletesFromRepository() {
        Event existing = Event.builder().id(5L).title("X")
                .startAt(LocalDateTime.now()).createdAt(LocalDateTime.now()).build();
        when(events.findById(5L)).thenReturn(Optional.of(existing));

        service.delete(5L);

        verify(events).delete(existing);
    }

    @Test
    void delete_missingId_throwsNotFound() {
        when(events.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(404L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Event")
                .hasMessageContaining("404");
        verify(events, never()).delete(any());
    }

    @Test
    void listAll_emptyRepository_returnsEmptyList() {
        when(events.findAllByOrderByStartAtAsc()).thenReturn(List.of());

        assertThat(service.listAll()).isEmpty();
    }
}
