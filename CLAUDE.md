# Versenynapi runbook — BME VIK Modern Fullstack és Mobil Fejlesztői Verseny

**Időpont:** 2026-05-11, 18:00–21:00 (3 óra), QBF14-15.
**Feladat:** Oktatásszervezési digitális portál (BE+DB+FE+mobil), többszereplős auth, GitHub-ra leadva.
**Pontozás (100p):** funkcionalitás 10 · üzleti logika 10 · mobilitás 10 · architektúra 10 · karbantarthatóság 10 · UX 5 · biztonság 5 · dokumentáció 5 · innováció 5 · (+egyebek).

## Idősáv (javaslat)

| Idő | Feladat |
|---|---|
| 18:00–18:15 | Specifikáció átolvasása, követelmény-checklist, entitások felírása papírra/jegyzetbe. |
| 18:15–18:30 | Repo előkészítés: `git init`, GitHub repo létrehozás, push. `docker-compose up -d`, `mvn spring-boot:run`, `npm install && npm run dev` — minden fut-e. |
| 18:30–19:30 | **Backend**: a kiírás szerinti entitások hozzáadása (másold a `Course` mintát: model → repo → controller → seeder). Role-based `@PreAuthorize`-ok. |
| 19:30–20:30 | **Frontend**: új oldalak (másold a `Courses.tsx` mintát). Reszponzív CSS gyors ellenőrzés (mobil viewport). |
| 20:30–20:45 | Üzleti logika finomítás, validáció, edge cases. |
| 20:45–20:55 | **README frissítés** (telepítés, futtatás, default user-ek, screenshot ha lehet). **`/nyilatkozat` futtatás**, output beillesztése a BME-s DOCX sablonba. |
| 20:55–21:00 | Final commit, push, beadás. |

## Aranyszabályok versenyhez
1. **Másold, ne újraírj.** A `Course` entity teljes flow-ja minta — új entitást a fájlnevek átírásával hozz létre 5 perc alatt.
2. **Először minden mai munka commitold a `verseny-start` branchre.** A versenyen lépésenként commitolj — látszik a fejlődés.
3. **Demo-felhasználók a Login oldalon prefilled.** Az értékelő 1 kattintással be tud lépni — UX pont.
4. **Mobil teszt**: Chrome DevTools → device toolbar (Ctrl+Shift+M) → iPhone 12. Ha jól néz ki, kész.
5. **Minden AI promptot logolj** `nyilatkozat/log-prompt.ps1`-gyel — különben a végén nem tudod kitölteni a nyilatkozatot.

## Eszközhasználati logolás — minta

Minden alkalommal, amikor új kódot generálsz Claude/Copilot/ChatGPT-vel:

```powershell
.\nyilatkozat\log-prompt.ps1 `
  -Category "Programkód generálása" `
  -Tool "Claude Code (Opus 4.7)" `
  -Prompt "Add a Grade entity with student/course/grade fields and CRUD endpoints" `
  -Files "backend/.../Grade.java, backend/.../GradeController.java" `
  -Notes "kb 80 sor"
```

## A verseny közben — önértékelés bármikor

```
/ertekel
```

Lefutott szempontonkénti pontozás (100p) + **Top 5 legjobb ROI-jú lépés** sorrendben.
Futtasd 30-45 percenként, hogy lásd hol állsz és mire koncentrálj. Output:
`nyilatkozat/output/ertekel-YYYY-MM-DD-HHMM.md`.

## A verseny végén — 1 parancsos nyilatkozat

Claude Code-ban:

```
/nyilatkozat
```

Ez kitölti a hivatalos BME sablont a `prompts.jsonl` és a projekt állapot alapján → `nyilatkozat/output/nyilatkozat-2026-05-11.md`.

## Beadáshoz checklist
- [ ] GitHub repo public, README-vel
- [ ] `docker-compose up -d && cd backend && mvn spring-boot:run` egyszerűen indítható
- [ ] Frontend `npm install && npm run dev` egyszerűen indítható
- [ ] 3 különböző role-lal be lehet lépni, mindegyik másképp viselkedik (auth)
- [ ] Mobilon (PWA / responsive) értelmesen megjelenik
- [ ] AI-nyilatkozat kitöltve, beadva a hivatalos DOCX-ben
