---
description: A BME VIK generatív MI nyilatkozat kitöltése a prompts.jsonl alapján
---

A felhasználó kéri, hogy állítsd elő a kitöltött **BME VIK generatív MI használati nyilatkozatot** a projekt aktuális állapota és a `nyilatkozat/prompts.jsonl` log alapján. A hivatalos sablon szerkezete a `nyilatkozat/template.md`-ben van.

# Lépések

## 1. Adatgyűjtés
- Olvasd be `nyilatkozat/prompts.jsonl`-t (egy JSON objektum soronként). Mindegyikben van: `timestamp, category, tool, prompt, files, notes`.
- Csoportosítsd a bejegyzéseket `category` szerint.
- Mérd fel a projekt méretét:
  - Backend Java kódsorok száma: számold meg a `backend/src/main/java/**/*.java` fájlokban a nem üres / nem-csak-comment sorokat. Bash: `find backend/src/main/java -name "*.java" | xargs wc -l` (vagy PowerShell `Get-ChildItem -Recurse -Filter *.java | Get-Content | Measure-Object -Line`).
  - Frontend TS/TSX sorok: `frontend/src/**/*.{ts,tsx}`.
  - Markdown dokumentáció sorai: `**/*.md` (kivéve `node_modules`, `target`).
- Becsüld meg minden kategóriához:
  - Generált tartalom arányát az adott típuson belül (pl. generált kódsor / összes kódsor).
  - Mit, hol érint (fájl-útvonalak, fejezetek).

## 2. Kategóriák — a hivatalos kategorizálás
1. Irodalomkutatás
2. Programkód generálása
3. Új ötletek, megoldási javaslatok generálása
4. Vázlat létrehozása (szövegstruktúra, vázlatpontok)
5. Szövegblokkok létrehozása
6. Képek generálása illusztrációs célból
7. Adatvizualizáció, grafikonok generálása adatpontok alapján
8. Prezentáció készítése
9. Egyéb (nevezze meg)

Egy versenyfeladatnál tipikusan **2** és **5** kategória releváns; a többinél írj `-`-t a sorba.

## 3. Kitöltés szabályai
Minden használt kategóriához:
- **Generatív MI eszköz neve**: a leggyakoribb `tool` érték (pl. "Claude Code (Opus 4.7)").
- **Érintett részek**: a `files` mezők összefoglalása fejezet/útvonal szinten (pl. "backend/security/* — JWT auth, backend/controller/* — REST endpointok").
- **Használat becsült aránya**: kategóriánként konkrét százalék, indoklással (pl. "kb. 380 / 420 Java sor generált = 90%").
- **Prompt lényegi része**: a legreprezentatívabb 1-2 prompt szó szerint idézve (idézőjelben).
- **Magyarázat**: 1-3 mondatos magyarázat, hogy mit csinált a generált tartalom és hogyan ellenőrizted (kompilált, futtatás, teszt). Az "ellenőriztem" rész kulcsfontosságú a BME-s nyilatkozatban.

## 4. Összesített arány és indoklás
- **Összesített százalékos érték (a feladat érdemi részére nézve)**: súlyozott átlag a kategóriánkénti arányokból. Versenyprojektnél tipikusan 60-90% között lesz — *ezt ne becsüld alá, mert a verseny szabályzata pont az AI használat **dokumentálását**, nem a tiltását várja el*.
- **Szöveges indoklás**: 3-5 bekezdés, mely:
  - Megnevezi mire használtad az AI-t (scaffold, boilerplate, üzleti logika, dokumentáció).
  - Hangsúlyozza mit csináltál saját kezűleg (architektúra-döntések, debug, integráció, UX-finomhangolás, adatmodell tervezés).
  - Ír egy mondatot az ellenőrzésről: "Minden generált kódot lefordítottam, manuálisan teszteltem, és szükség esetén javítottam."

## 5. Kimenet
- Hozz létre `nyilatkozat/output/nyilatkozat-YYYY-MM-DD.md`-t a kitöltött tartalommal.
- A struktúra **pontosan** kövesse a `nyilatkozat/template.md`-t (sorrend, oszlopok, fejlécek).
- Üres/nem-használt kategóriáknál minden mezőbe `-` kerüljön.
- A végén print-eld a fájl elérési útját és egy javaslatot:
  ```
  Konvertálás DOCX-re (ha van Pandoc):
    pandoc nyilatkozat/output/nyilatkozat-2026-05-11.md -o nyilatkozat/output/nyilatkozat.docx
  Vagy: másold a tartalmat a hivatalos BME .docx sablonba.
  ```

# Fontos
- **Légy konzervatív felfelé** az arányokkal: jobb őszintén 80%-ot bejelölni, mint 30%-ot és gyanút kelteni.
- **Ne találj ki promptokat**, amik nincsenek a logban — csak amik tényleg ott vannak.
- Ha a `prompts.jsonl` üres vagy hiányzik: figyelmeztesd a felhasználót, hogy retroaktíve adja hozzá a használt promptokat, mielőtt a parancsot újra futtatja.
