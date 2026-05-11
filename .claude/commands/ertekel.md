---
description: A projekt önértékelése a hivatalos versenyszempontok szerint (100p), priorizált javaslatlistával
---

A felhasználó a versenyén dolgozik. Ki kell értékelni a projekt **jelenlegi állapotát** a hivatalos 100-pontos rendszer szerint, és **konkrét, sorrendezett tennivalókat** kell adni neki a hátralévő időre.

# 1. Adatgyűjtés (lehetőleg párhuzamosan)

- `git log --oneline -20` (ha van git history) — fejlődési íve és gyakori commit-stílus
- `git status` — van-e uncommitted nagy halom változás
- Backend fájlok: `ls backend/src/main/java/com/verseny/portal/**/*.java`
- Frontend fájlok: `ls frontend/src/**/*.{ts,tsx}`
- Kódsorok számolása nagy vonalakban (Glob + Read mintavételre, NEM minden fájlt olvasni)
- README.md, CLAUDE.md, docker-compose.yml: szerkezet és tartalom check
- Olvass bele a kulcsfájlokba: SecurityConfig, AuthController, App.tsx, vite.config.ts, application.yml
- Nézd a `frontend/public/manifest.webmanifest`-et (PWA telepíthetőség)

# 2. Pontozás kategóriánként

A hivatalos szempontrendszer (összesen 100p):

| # | Kategória | Max | Mit nézzünk |
|---|---|---|---|
| 1 | Kompakt működés | 10 | Fő menüpontok átláthatósága, navigáció, hány feature working flow-val |
| 2 | Részletes funkcionalitás | 10 | Üzleti logika mélysége, entitások közti kapcsolatok, validáció, üzleti szabályok |
| 3 | Szerepkörök | 5 | Hány role, role-specifikus UI, `@PreAuthorize` lefedettsége |
| 4 | Kommunikáció | 10 | REST minőség (RESTful endpoint-ok), JWT, CORS, válaszidők, paginations, error-formátum |
| 5 | Adatkezelés | 5 | Adatmodell bővíthetősége, FK-k, indexek, JPA relációk minősége |
| 6 | Architektúra | 10 | Réteg-szeparáció (controller/service/repo), modularitás, DTO-k, dependency injection |
| 7 | Karbantarthatóság | 10 | Kódminőség, naming, duplikáció, fájlméret, package-szervezés |
| 8 | Hibakezelés | 5 | Try/catch, `@ControllerAdvice`, validation errors, log4j vagy SLF4J használata |
| 9 | Biztonság | 5 | BCrypt, JWT exp, CORS whitelist, SQL injection védettség (JPA), CSRF/XSS, secrets nem committed |
| 10 | UX | 5 | Reszponzivitás (media query), accessibility (label, aria), loading state, error feedback |
| 11 | Mobilitás | 10 | PWA manifest + service worker + telepíthetőség, mobil viewport tesztelve, touch UX |
| 12 | Telepíthetőség | 5 | README install steps, default user-ek, docker-compose, port-dokumentáció |
| 13 | Repo rendezettség | 5 | Folder structure logikus, `.gitignore` jó, nincs `node_modules` / `target` committed, CLAUDE.md/dokumentáció |
| 14 | Innováció | 5 | Bármi extra: dark mode, real-time, AI feature, charts, export, push notification, stb. |

## Pontozási szabályok
- **Légy szigorú, mint egy versenybíró**: a 10p csak akkor jár, ha az adott terület **nagyon jól meg van csinálva**, nem csak "működik".
- **Bare boilerplate ≈ 2-4/10**, működő alap-feature ≈ 5-7/10, gazdag implementáció + szépen csinálva ≈ 8-10/10.
- Pontot **fél-pont** lépésekkel adj (2.5, 3.5 stb.), ne csak egészeket.
- Minden pontnál írj 1 sorban indoklást: **mit látsz a kódban**, ami miatt ennyi (és nem több vagy kevesebb).

# 3. Output formátum

Hozz létre / felülír `nyilatkozat/output/ertekel-YYYY-MM-DD-HHMM.md`-t **pontosan** ezzel a szerkezettel:

```markdown
# Önértékelés — {ISO timestamp}

## Összesítő: {X} / 100 pont

| # | Kategória | Pont | Max | Indoklás (1 sor) |
|---|---|---|---|---|
| 1 | Kompakt működés | 5.5 | 10 | Login + 1 CRUD oldal van, dashboard üres, nincs menü-hierarchia |
| 2 | Részletes funkcionalitás | 3 | 10 | Csak Course entity, nincs Enrollment/Grade/Timetable, nincs üzleti logika a CRUD-on túl |
| ... | ... | ... | ... | ... |
| **Összesen** | | **{X}** | **100** | |

## Top 5 legjobb ROI-jú lépés a hátralévő időben

Sorrendben — fent a legtöbb pont a legkevesebb idővel:

### 1. {feladat} → +{pont} pont, kb. {idő}
{2-3 mondatos magyarázat: miért éri meg, és konkrétan mit csinálj. Hivatkozz fájlra: pl. "új entitás a Course mintán: backend/src/.../Enrollment.java"}

### 2. {feladat} → +{pont} pont, kb. {idő}
...

### 3. {feladat} → +{pont} pont, kb. {idő}
...

### 4. {feladat} → +{pont} pont, kb. {idő}
...

### 5. {feladat} → +{pont} pont, kb. {idő}
...

## Részletes elemzés kategóriánként

### 1. Kompakt működés ({pont}/10)
**Jelenlegi állapot**: {mit látsz}
**Hogy lehetne 10/10**: {mi hiányzik}

### 2. Részletes funkcionalitás ({pont}/10)
...

(... mind a 14 kategória)

## Mit NE csinálj a hátralévő időben
Lista azokról, amik a maradék pontból nem hoznak sokat de időt visznek (pl. "ne refaktoráld a meglévő kódot", "ne tervezz új biztonsági réteget").
```

# 4. Útmutató a Top 5 priorizáláshoz

A "Top 5 legjobb ROI-jú lépés" rész a **legkritikusabb output**. Itt:
- Becsüld meg a +pontot **konzervatívan** (inkább alulbecsüld).
- Az időt **valósan**: ne mondj 15 percet egy 45 perces feladatra.
- **Verseny végéhez közel** (kevesebb mint 30 perc maradt): csak gyors fixek menjenek a listára (README javítás, screenshot, demo user prefill, stb.). NE javasolj új entitást ekkor.
- **Verseny elején** (1+ óra maradt): új feature-ök, új entitások mehetnek listára.
- Ha tudod a versenyidőből hátralevő időt (CLAUDE.md `## Idősáv` szerint 21:00 a vége), számold be.

# 5. Záróként
Print-eld a kimenet fájl elérési útját és a top1 lépés egy mondatos összefoglalóját. Pl.:

```
Output: nyilatkozat/output/ertekel-2026-05-11-1845.md
Most a legnagyobb ROI: Enrollment entity + UI (+8 pont, kb. 25 perc).
```

# Fontos
- **Ne legyél barátságos**: ne dicsérgesd ami nincs. Ha az UX gáz, írd hogy "5p-ből 1, mert csak 1 oldal van form-okkal".
- **Ne találj ki feature-eket** amik nincsenek a kódban. Olvasd el a fájlokat.
- A pontozás **becslés** — a versenybírók másképp pontoznak. De a relatív rangsor a kategóriák között hasznos a priorizáláshoz.
