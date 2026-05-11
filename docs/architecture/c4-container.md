# C4 Container ábra

Ez az ábra a rendszer fő komponenseit és köztük lévő kommunikációt mutatja. A kliens oldalon webes és mobil frontend, a szerver oldalon a Java monolit, a Python chatbot service és a közös Postgres adatbázis.

```mermaid
C4Container
    title Oktatási portál, Container szint

    Person(student, "Diák")
    Person(teacher, "Oktató")
    Person(admin, "Admin")

    System_Boundary(portal, "Portál") {
        Container(webApp, "Webes frontend", "React + Vite + PWA")
        Container(mobileApp, "Mobil app", "React Native + Expo (tervezett)")
        Container(monolith, "Backend monolit", "Spring Boot, Spring Modulith")
        Container(chatbot, "Chatbot service", "Python + FastAPI (tervezett)")
        ContainerDb(db, "Adatbázis", "PostgreSQL")
    }

    System_Ext(claude, "Anthropic Claude API")

    Rel(student, webApp, "Használ", "HTTPS")
    Rel(student, mobileApp, "Használ", "HTTPS")
    Rel(teacher, webApp, "Használ", "HTTPS")
    Rel(admin, webApp, "Használ", "HTTPS")
    Rel(webApp, monolith, "REST API, JWT", "JSON/HTTPS")
    Rel(mobileApp, monolith, "REST API, JWT", "JSON/HTTPS")
    Rel(webApp, chatbot, "Chat SSE", "HTTPS")
    Rel(chatbot, monolith, "Tool callok a user JWT-jével", "JSON/HTTPS")
    Rel(monolith, db, "JPA", "SQL")
    Rel(chatbot, db, "Külön séma", "SQL")
    Rel(chatbot, claude, "LLM hívás", "HTTPS")
```

## Magyarázat

A webes és a mobil kliens egyaránt a monolitot szólítja a portál üzleti adataihoz (jegyek, órarend, üzenetek). A chatbot felé külön SSE csatorna megy, a chatbot pedig tool use-szal úgy hív vissza a monolitra, hogy a felhasználó JWT-jét továbbküldi, így az `@PreAuthorize` szabályok automatikusan érvényesülnek.

Az adatbázis közös Postgres instance. A chatbot egy külön sémában tárolja a beszélgetéseket, ezzel az isolation egyszerű és deploymentkor nincs külön DB konténer.

A "tervezett" jelzésű komponensek (mobil app, chatbot service) a verseny során épülnek meg, lásd [TASKS/](../../TASKS/) mappa briefjeit.
