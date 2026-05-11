# H — Service-réteg konzisztencia (Event, Message, Schedule)

> **Indulás előtt**: `git checkout main && git pull`. Friss main legyen.

## Cél

A `feat/service-layer` refactor 6 service osztályt hozott (`AuthService`, `GradingService`, `SchoolClassService`, `StudentService`, `SubjectService`, `SubjectAssignmentService`), DE az új feature controllerek (`EventController`, `MessageController`, `ScheduleController`) **közvetlenül a repository-t hívják**. Ez inkonzisztens.

Húzd ki az üzleti logikát ezekből a controllerekből 3 új service-be, ugyanazt a mintát követve mint a meglévő 6.

## Branch

```powershell
git checkout main && git pull
git checkout -b feat/service-consistency
```

## Tulajdonolt fájlok (kizárólag)

- `backend/src/main/java/com/verseny/portal/service/EventService.java` (új)
- `backend/src/main/java/com/verseny/portal/service/MessageService.java` (új)
- `backend/src/main/java/com/verseny/portal/service/ScheduleService.java` (új)
- `backend/src/main/java/com/verseny/portal/controller/EventController.java` (refactor)
- `backend/src/main/java/com/verseny/portal/controller/MessageController.java` (refactor)
- `backend/src/main/java/com/verseny/portal/controller/ScheduleController.java` (refactor)

## TILOS érinteni

- `frontend/` — semmi
- `chatbot/` — semmi
- `model/`, `dto/`, `repository/` — semmi (csak service + controller változik)
- Bármi más controller / service
- DataSeeder
- API URL-eket NEM változtatsz
- DTO struktúrákat NEM változtatsz
- JSON response shape NEM változik
- `@PreAuthorize` annotációk a controllereken maradnak

## Konkrét lépések

### 1. Mintaszemle (5 perc)
Olvasd el a meglévő `service/GradingService.java`-t és `controller/GradeController.java`-t. Pattern:
- Service: `@Service`, final field DI, `@Transactional` szükség szerint, custom exception-ök dobása
- Controller: vékony, `@PreAuthorize` rajta marad, body 1-3 sor (delegál service-re), DTO mapping vagy service-ben vagy controllerben (a meglévő minta: service repository-t hív + DTO-t konstrukciókat, controller hívja a service-t)

Ugyanezt a stílust kövesd a 3 új service-ben.

### 2. EventService
- `@Service`, final fields: `EventRepository events`, `CurrentUser currentUser`
- Public metódusok átveszik a logikát a `EventController`-ből:
  - `List<EventResponse> listAll()`
  - `EventResponse create(EventCreateRequest req)` — `createdBy = currentUser.require()`
  - `void delete(Long id)` — `NotFoundException.of("Event", id)` ha nincs
- A controller `events.findAll...` és `events.save...` és `events.delete...` hívásai service-be mennek

### 3. MessageService
- `@Service`, final fields: `MessageRepository messages`, `UserRepository users`, `CurrentUser currentUser`
- Public metódusok:
  - `List<MessageResponse> inbox()`
  - `List<MessageResponse> conversationWith(Long otherUserId)`
  - `UnreadCountResponse unreadCount()`
  - `List<ContactResponse> contacts()`
  - `MessageResponse send(MessageCreateRequest req)` — saját maga küldés tiltott
  - `void markRead(Long messageId)` — csak ha a current user a `toUser`
- AuthorizationException dobás a megfelelő helyeken

### 4. ScheduleService
- `@Service`, final fields: `ScheduleSlotRepository slots`, `SubjectAssignmentRepository assignments`, `StudentRepository students`, `CurrentUser currentUser`
- Public metódusok:
  - `List<ScheduleSlotResponse> myClassSchedule()` (HALLGATO)
  - `List<ScheduleSlotResponse> myTeachingSchedule()` (OKTATO)
  - `List<ScheduleSlotResponse> all()` (ADMIN, SUPERADMIN)
  - `ScheduleSlotResponse create(ScheduleSlotCreateRequest req)` (ADMIN, SUPERADMIN)
  - `void delete(Long id)` (ADMIN, SUPERADMIN)

### 5. Controllerek vékonyítása
Mindhárom controllerben:
- `private final XxxService service;` (constructor inject)
- A repository-kat **kivedd** a controllerből (a service-ben élnek tovább)
- Endpointok body 1-3 sor: `return service.method(args);`
- `@PreAuthorize`, `@Operation`, `@Tag` MARAD a controllereken
- HTTP status `201 CREATED` POST-on (a meglévő minta szerint)

### 6. Smoke teszt
```powershell
cd backend
./mvnw clean install     # vagy mvn ha PATH-on van
./mvnw spring-boot:run
```

Curl-lel egy login után:
```powershell
$body = '{"email":"admin@portal.hu","password":"password"}'
$token = (curl -X POST -H "Content-Type: application/json" -d $body http://localhost:8081/api/auth/login | ConvertFrom-Json).token

# Test all 3 refactored endpoints
curl -H "Authorization: Bearer $token" http://localhost:8081/api/events
curl -H "Authorization: Bearer $token" http://localhost:8081/api/messages/inbox
curl -H "Authorization: Bearer $token" http://localhost:8081/api/schedule
```

Mindegyik 200-at kell adjon, ugyanaz a JSON shape mint refactor előtt.

### 7. Commit + PR
Conventional Commits-szel commitold külön a 3 service-t:
```
refactor(events): extract EventService from controller
refactor(messaging): extract MessageService from controller
refactor(scheduling): extract ScheduleService from controller
```

Push: `git push -u origin feat/service-consistency`, aztán PR main-be.

## Definition of Done

- [ ] `mvn clean install` zöld
- [ ] Backend elindul hibátlan
- [ ] Smoke curl 3 refaktorált endpointra: ugyanaz a JSON mint refactor előtt
- [ ] EventController/MessageController/ScheduleController **NEM** importál Repository-t (csak Service-t)
- [ ] Frontend funkciók működnek **változatlanul** (events lista, üzenetküldés, órarend nézet)
- [ ] Conventional Commits külön a 3 refaktorra
- [ ] PR main-be

## Időkeret

30 perc max. Ha 20 perc múlva még piros minden, állj le, commitold ami van, és szólj.

## Tipp

- A service-ek `@Service` annotációja elég, `@Transactional`-t csak ott, ahol több művelet egy tranzakcióban (pl. `Message.send` ahol unread count is változhatna).
- Ha valamelyik metódusban az authorization check + DB lekérdezés bonyolult, marad a service-ben — a controller csak delegál.
- Az `AuthorizationException`, `NotFoundException` factory-k (`NotFoundException.of("Event", id)`) használata egységes legyen.
