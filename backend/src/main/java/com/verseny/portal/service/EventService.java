package com.verseny.portal.service;

import com.verseny.portal.dto.EventDtos.EventCreateRequest;
import com.verseny.portal.dto.EventDtos.EventResponse;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.Event;
import com.verseny.portal.repository.EventRepository;
import com.verseny.portal.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EventService {

    private final EventRepository events;
    private final CurrentUser currentUser;

    public EventService(EventRepository events, CurrentUser currentUser) {
        this.events = events;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listAll() {
        return events.findAllByOrderByStartAtAsc().stream().map(EventResponse::from).toList();
    }

    public EventResponse create(EventCreateRequest req) {
        Event saved = events.save(Event.builder()
                .title(req.title())
                .description(req.description())
                .startAt(req.startAt())
                .endAt(req.endAt())
                .location(req.location())
                .createdBy(currentUser.require())
                .build());
        return EventResponse.from(saved);
    }

    public void delete(Long id) {
        Event e = events.findById(id).orElseThrow(() -> NotFoundException.of("Event", id));
        events.delete(e);
    }
}
