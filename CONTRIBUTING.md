# Közreműködés

## Branch stratégia

- `main`: stabil, csak átment PR-ek mennek bele.
- `feat/<rövid-leírás>`: új funkció.
- `fix/<rövid-leírás>`: hibajavítás.
- `refactor/<rövid-leírás>`: nem funkcionális változás.

## Commit üzenetek

Conventional Commits formátum: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`. Példa:

```
feat(grading): add weighted average use case
fix(auth): handle expired refresh token
docs(adr): add ADR for chatbot service
```

## PR követelmények

- CI zöld (build, tesztek).
- Spotless és ESLint clean.
- Új funkcióhoz lehetőleg egy happy path teszt.

## Lokális futtatás

Lásd a [README.md](README.md) "Gyors indítás" szekcióját.

## Modul-szerkezet

Új backend feature esetén javasolt a hexagonal layering a `com.verseny.portal.<modul>` package alatt:

- `api/`: publikus interfész más modulok felé.
- `domain/`: tiszta üzleti logika, framework-mentes.
- `application/`: use case-ek.
- `infrastructure/`: REST controller, JPA repository.

A modulhatárokat `@ApplicationModule` és ArchUnit teszt tartja egyben.
