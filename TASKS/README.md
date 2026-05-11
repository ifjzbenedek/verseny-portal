# Párhuzamos AI-agent munkafolyamat

Ez a mappa tartalmazza a párhuzamos AI ablakok briefjeit. Minden brief önálló — egy friss Claude Code ablakba bemásolva el tudja kezdeni a munkát.

## Workflow

```
                  ┌──────────────────────────┐
                  │  00-FOUNDATION (1 ablak) │   ← FIRST, sequential
                  │  Új entitások + endpointok│
                  │  → push to main           │
                  └────────────┬─────────────┘
                               │
              ┌────────────────┼────────────────┬─────────────┬──────────────┐
              │                │                │             │              │
        ┌─────▼────┐    ┌──────▼─────┐  ┌───────▼──────┐  ┌──▼─────────┐ ┌──▼────────┐
        │    A     │    │     B      │  │      C       │  │     D      │ │    E      │
        │ Backend  │    │  Frontend  │  │  Chatbot     │  │  Mobile    │ │ DevOps +  │
        │ modulok  │    │  redesign  │  │  service     │  │  (Expo)    │ │ Observ.   │
        │          │    │            │  │  (Python)    │  │            │ │           │
        └─────┬────┘    └──────┬─────┘  └───────┬──────┘  └──┬─────────┘ └──┬────────┘
              │                │                │             │              │
              │           ┌────▼────┐           │             │              │
              │           │    F    │ ← parallel everywhere   │              │
              │           │  Docs   │   (independent folder)  │              │
              │           └────┬────┘                         │              │
              │                │                              │              │
              └────────────────┴───────┬──────────────────────┴──────────────┘
                                       │
                                       ▼
                              ┌────────────────────┐
                              │        G           │   ← FINAL, sequential
                              │ Integration & QA   │
                              │      polish        │
                              └────────────────────┘
                                       │
                                       ▼
                                    Beadás
```

## Fázisok

| Fázis | Tartalom | Ablakok | Idő |
|---|---|---|---|
| **0. Foundation** | Core entitások + endpointok | 1 (szekvenciális) | ~10h |
| **1. Párhuzamos build** | A + B + C + D + E + F | 6 párhuzamos | ~13h/ablak |
| **2. Integration & QA** | G | 1 (szekvenciális) | ~10h |

## Briefek

| # | Brief | Mikor | Branch | Owned folder |
|---|---|---|---|---|
| 0 | [00-FOUNDATION.md](00-FOUNDATION.md) | **elsőként** | `feat/foundation` | `backend/` core |
| A | [A-backend-modules.md](A-backend-modules.md) | F0 után párhuzamos | `feat/backend-modules` | `backend/src/` modulok |
| B | [B-frontend-redesign.md](B-frontend-redesign.md) | F0 után párhuzamos | `feat/frontend-redesign` | `frontend/` |
| C | [C-chatbot-service.md](C-chatbot-service.md) | F0 után párhuzamos | `feat/chatbot-service` | `chatbot/` (új) |
| D | [D-mobile-expo.md](D-mobile-expo.md) | F0 után párhuzamos | `feat/mobile-expo` | `mobile/` (új) |
| E | [E-devops-observability.md](E-devops-observability.md) | F0 után párhuzamos | `feat/devops-observability` | `.github/`, `k8s/`, `observability/` |
| F | [F-documentation.md](F-documentation.md) | bármikor párhuzamos | `feat/documentation` | `docs/` |
| G | [G-integration-qa.md](G-integration-qa.md) | **A-F merged után** | `feat/integration-qa` | `e2e/`, `load-test/`, polish |

## Konfliktus-mentes zónák

A párhuzamos ablakok **különálló mappákon** dolgoznak, így merge konfliktus minimális.

| Ablak | Tulajdonol (kizárólag) | TILOS érinteni |
|---|---|---|
| Foundation | `backend/src/main/java/com/verseny/portal/`, `backend/pom.xml`, `application.yml` | (egyedül fut, nincs konfliktus) |
| A | `backend/src/main/java/.../` új modulok, `backend/pom.xml` (új dep), `backend/src/test/java/` | `frontend/`, `chatbot/`, `mobile/`, `docs/`, `.github/`, `k8s/` |
| B | `frontend/` egész | `backend/`, `chatbot/`, `mobile/`, `docs/`, `.github/`, `k8s/` |
| C | `chatbot/` (új), `docker-compose.yml` (1 sor) | `backend/src/`, `frontend/`, `mobile/`, `docs/` |
| D | `mobile/` (új) | `backend/`, `frontend/`, `chatbot/`, `docs/`, `.github/` |
| E | `.github/`, `k8s/`, `observability/`, `docker-compose.observability.yml`, Dockerfile-ok | `*/src/`, kód mappa |
| F | `docs/`, `CONTRIBUTING.md`, `CHANGELOG.md`, README új szekciók | bármely kód mappa |
| G | `e2e/`, `load-test/`, `docs/screenshots/`, README final, bárhol bug fix | — (utolsó fázis, kezelheti) |

### Megosztott fájlok (óvatos koordináció)

- `docker-compose.yml`: C hozzáadja a chatbot service-t a `# CHATBOT_SERVICE_PLACEHOLDER`-hez. E health checkeket adhat hozzá → szöveges merge.
- `backend/Dockerfile`: E multi-stage refactor — koordinálj A-val.
- `backend/src/main/resources/application.yml`: Foundation létrehozza, E (Actuator) + A (módosíthatja) — separate profile-okkal javasolt.
- `backend/pom.xml`: Foundation hozzáad, A bővíti modulokkal, E observability dep-ekkel — három-kezű koordináció.
- `README.md`: minden ablak külön szekciót szerkeszt — header alapú merge oldódik.
- `TERV.md`, `CLAUDE.md`: senki ne nyúljon hozzá merge előtt — emberi review után.

## Git workflow

1. **Foundation** ablak indul, branch `feat/foundation`. PR → `main` merge.
2. **6 párhuzamos ablak** (A, B, C, D, E, F) indul a friss `main`-ből.
3. Minden ablak Conventional Commits-szel commitol gyakran.
4. Ablakok befejezésekor PR `main`-be, CI zöld kell.
5. **Konfliktus esetén ember oldja meg**, NEM agent.
6. Mind merged → **G ablak** indul integrációra, e2e tesztelésre, polishra.
7. G PR mergelése után tag `v1.0.0`, beadás.

## Indítás (egy AI ablak per brief)

Minden ablakba a brief tartalmát be kell illeszteni system prompt-szerűen, vagy első user üzenetként:

> Olvasd el a `TASKS/<brief>.md`-t. Ezt fogod végrehajtani. A repo gyökere a working directory. Indulj.

Az agent ezután önállóan dolgozik a saját mappáján.

## Tipp a koordináláshoz

- **Foundation** ablakot **biztosan egyedül** futtasd, várd meg a merge-t. A többi mind tőle függ.
- A **6 párhuzamos ablak**-ot egymástól függetlenül indíthatod, de javasolt a sorrend: A + B + F először (a backend és frontend kell a többi alapjához), aztán C + D + E (chatbot, mobile, observability) — a wall-clock optimumért.
- **F** (docs) bármikor indítható, akár a többivel teljesen párhuzamosan, mert csak `docs/`-on dolgozik.
- **G** ne induljon, amíg A-F mind merged. Különben e2e teszt instabil.
- **PR review**: minden PR-t mergelés előtt nézz át (akár AI-jal, akár emberül) — főleg a `pom.xml`, `docker-compose.yml`, `application.yml` változásokat.
- **CI zöld kötelező** a merge előtt.
