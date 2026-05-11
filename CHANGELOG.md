# Changelog

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) ajánlását követi, a verziózás pedig a [Semantic Versioning](https://semver.org/) elveit.

## [Unreleased]

### Added
- Foundation entitások: `SchoolClass`, `Student`, `Subject`, `SubjectAssignment`, `Grade` és a hozzájuk tartozó CRUD endpointok role-based jogosultsággal.
- `SUPERADMIN` szerepkör.
- `GlobalExceptionHandler` RFC 7807 Problem Details válasszal.
- OpenAPI / Swagger UI dokumentáció.
- Architektúrális dokumentáció: ADR-ek, C4 Container ábra, role mátrix, fogalomtár (`docs/`).

## [0.1.0] - 2026-05-11

### Added
- Spring Boot + React + JWT alap boilerplate.
- `Course` entitás példa CRUD-dal.
- PWA manifest és service worker.
- Docker Compose Postgres.
- Generatív MI használati nyilatkozat generálási folyamat (`nyilatkozat/`).
