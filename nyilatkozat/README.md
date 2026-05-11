# AI-nyilatkozat rendszer

A BME VIK [hivatalos sablon](https://vik.bme.hu/document/7193/original/Generativ_MI_Pelda_Nyilatkozat_Szakdolgozathoz.pdf) szerinti generatív MI nyilatkozat **félautomata kitöltése**.

## Munkafolyamat

**1) Verseny közben, MINDEN promptról logolj.**

Akárhányszor használsz Claude Code-ot, ChatGPT-t, Copilotot, stb. — egy soros bejegyzés a `prompts.jsonl`-be:

```powershell
.\nyilatkozat\log-prompt.ps1 -Category "Programkód generálása" -Tool "Claude Code (Opus 4.7)" -Prompt "Generálj Spring Boot CourseController-t CRUD-dal" -Files "backend/.../CourseController.java" -Notes "kb 60 sor kód"
```

A `Category` az alábbiak egyike (a hivatalos kategorizálás szerint):
- `Irodalomkutatás`
- `Programkód generálása`
- `Új ötletek, megoldási javaslatok generálása`
- `Vázlat létrehozása`
- `Szövegblokkok létrehozása`
- `Képek generálása illusztrációs célból`
- `Adatvizualizáció, grafikonok generálása adatpontok alapján`
- `Prezentáció készítése`
- `Egyéb`

**2) A verseny végén futtasd a slash command-ot Claude Code-ban:**

```
/nyilatkozat
```

Ez:
- Beolvassa `prompts.jsonl`-t
- Felméri a projekt összes kódját és dokumentációját
- Számolja kategória- és arányszámokat (generált kódsor / teljes kódsor stb.)
- Kitölti a hivatalos sablonnak megfelelő Markdown-t → `output/nyilatkozat-{dátum}.md`

**3) Konvertálás a hivatalos DOCX/PDF formátumra:**

Két lehetőség:
- **Másold be**: nyisd meg a BME-s `.docx` sablont, és illeszd be a generált tartalmat a táblázatba.
- **Pandoc**: `pandoc output/nyilatkozat-2026-05-11.md -o output/nyilatkozat.pdf` (ha van Pandoc).

## Fájlok
- `prompts.jsonl` — append-only log (JSON-per-line)
- `log-prompt.ps1` — log-helper script
- `template.md` — a nyilatkozat szerkezete (referencia)
- `output/` — generált kitöltött nyilatkozatok (git-ignore-olva)
