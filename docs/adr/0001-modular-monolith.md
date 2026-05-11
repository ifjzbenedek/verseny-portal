# ADR-0001: Modular monolit Spring Modulith-tal

**Státusz:** Accepted
**Dátum:** 2026-05-11

## Kontextus

A portál domainje (felhasználók, osztályok, tárgyak, jegyek, órarend, üzenetek, beadandók) erősen összekapcsolt. Egy hallgatói dashboard egyetlen kérésre négy-öt domain területről húz adatot. Microservice felállásban ez elosztott tranzakciókat és eventual consistency problémákat hozna magával, amit egy egyfős fejlesztői csapatnak nem éri meg vállalni.

## Döntés

A backend egyetlen Spring Boot alkalmazás, amelyen belül a kódot Spring Modulith stílusú, package-szintű modulokra bontjuk. A modulokat `@ApplicationModule` annotációk jelölik, és a megengedett függőségeket egy build-time verify ellenőrzi.

## Indoklás

- ACID tranzakció minden cross-module műveletre (például beadandó értékelése, ami automatikusan jegyet is rögzít).
- Egyetlen log, egyetlen stack trace, egyszerűbb hibakeresés.
- A modulhatárok package szinten léteznek, így az IDE refactor (átnevezés, mozgatás) működik közöttük.
- Ha később egy modul külön skálázási profilba kerül, hexagonal port és adapter határa miatt viszonylag olcsón kiemelhető önálló service-be.

## Következmények

**Pozitív:**
- Egyetlen Compose service a backendre, gyors indulás dev környezetben.
- Tranzakciós konzisztencia ingyen.
- A Modulith verify build-time elkapja a modul-szivárgásokat.

**Negatív, kompromisszum:**
- Egy JVM instance terhel mindent, vertikális és horizontális skálázás csak az egész monoliton.
- Több fejlesztő párhuzamos munkájához koordináció kell (deploymentnél, közös fájloknál).

## Alternatívák

- **Klasszikus microservice felállás (négy-öt service):** elvetve a domain összekapcsoltsága és a csapatméret miatt.
- **Sima monolit Modulith nélkül:** elvetve, mert a modulhatárok puszta konvencióvá züllenének, idővel összemosódna minden.
