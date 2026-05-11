# C — Chatbot service (Python + FastAPI + Anthropic SDK)

> **Indulás előtt**: [00-FOUNDATION.md](00-FOUNDATION.md) merged `main`-be. `git pull`.
> Tudnod kell, hogy a backend hol fut (`http://localhost:8081`) és milyen JWT-t bocsát ki.

## Cél

Új Python FastAPI service `chatbot/` mappában. Validálja a felhasználói JWT-t (a backend ugyanazon kulcsával), beszélget Claude-dal, tool use-szal lekérdez adatokat a monolittól (a user JWT-jét továbbadva), chat history-t ment Postgres-be, SSE streamel a frontendnek. RAG egyszerűsített, opcionálisan pgvector-rel.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/chatbot-service
```

## Tulajdonolt fájlok (kizárólag)

- `chatbot/` (új mappa, scratch)
- `docker-compose.yml` (CSAK hozzáadod a chatbot service-t a `# CHATBOT_SERVICE_PLACEHOLDER` jelölőhöz)
- `README.md` (egy új "Chatbot" szekció hozzáadása)

## TILOS érinteni

- `backend/src/` (kivéve ha kifejezetten az AuthController-ben kell egy `/auth/jwks` endpoint — egyeztess, ne csináld magad)
- `frontend/`
- `mobile/`
- `TERV.md`, `CLAUDE.md`, `TASKS/*`

## Deliverables

### 1. Projekt scaffold

```
chatbot/
├── Dockerfile
├── pyproject.toml
├── alembic.ini
├── alembic/
│   └── versions/
├── app/
│   ├── __init__.py
│   ├── main.py                     ← FastAPI app
│   ├── config.py                   ← Settings (pydantic-settings)
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt_validator.py        ← PyJWT RS256 / HS256 validáció
│   ├── chat/
│   │   ├── __init__.py
│   │   ├── routes.py               ← /chat endpoints (SSE)
│   │   ├── service.py              ← chat session logic
│   │   └── claude_client.py        ← Anthropic SDK wrapper
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── registry.py             ← tool definitions
│   │   ├── monolith_client.py      ← httpx wrapper a monolithoz
│   │   └── handlers.py             ← tool call execution
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── ingest.py               ← document chunk + embed
│   │   ├── search.py               ← hybrid search
│   │   └── models.py
│   ├── persistence/
│   │   ├── __init__.py
│   │   ├── database.py             ← SQLAlchemy engine + session
│   │   └── models.py               ← Conversation, Message, Document, DocumentChunk
│   └── observability/
│       ├── logging.py              ← structlog JSON
│       └── tracing.py              ← OpenTelemetry (opcionális)
└── tests/
    ├── test_auth.py
    ├── test_chat.py
    └── test_tools.py
```

### 2. `pyproject.toml`

```toml
[project]
name = "chatbot"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi[standard]>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "anthropic>=0.40.0",
    "pyjwt[crypto]>=2.9.0",
    "httpx>=0.27.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "pgvector>=0.3.0",
    "pydantic-settings>=2.5.0",
    "structlog>=24.4.0",
    "sse-starlette>=2.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
]
```

### 3. Auth — JWT validáció

A monolit jelenleg HS256 szimmetrikus kulcsot használ (jjwt 0.12.5 default). A chatbot service-be két opció:

**Egyszerűbb (most ezt)**: HS256 ugyanazzal a secret-tel.
- `.env`: `JWT_SECRET=<ugyanaz mint a monoliton>`
- `app/auth/jwt_validator.py`: PyJWT-vel validál, kiveszi `sub` (userId), `role`-t.

**Production-grade (csak ha van idő)**: a monolit publikál egy JWKS endpointot, a chatbot fetcheli — RS256. Ez backend változást igényel, **most NE csináld**.

FastAPI dependency:
```python
async def get_current_user(authorization: str = Header(...)) -> CurrentUser:
    token = authorization.removeprefix("Bearer ").strip()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    return CurrentUser(id=int(payload["sub"]), email=payload.get("email"), role=payload["role"])
```

### 4. Claude integráció

`app/chat/claude_client.py`:
- Anthropic Python SDK
- Modell default: `claude-haiku-4-5-20251001`, komplex kérdésre `claude-sonnet-4-6` (modell paraméter overrideolható)
- **Prompt caching** a system promptra (`cache_control: {"type": "ephemeral"}` a system prompt utolsó blokkjában)
- Tool use enabled
- Streaming (SSE)

System prompt magyarul:
```
Te egy iskolai asszisztens chatbot vagy egy oktatási portálon. Segíts a diákoknak, oktatóknak és adminoknak a feladataikban.
Mindig udvarias és segítőkész vagy. Ha a felhasználó kérdése a saját adataira vonatkozik (jegyek, órarend, beadandók), használd a megfelelő tool-t.
Ha nem tudsz egy kérdésre válaszolni, mondd ki tisztán.
A jelenlegi felhasználó: {{user_email}}, szerepköre: {{user_role}}.
```

A system prompt cache-elhető (statikus része).

### 5. Tool definitions (Claude tool use)

`app/tools/registry.py` — eszközök JSON sémája Claude-nak:

- `get_my_grades`: `{ "subject_name": string? }` → HALLGATO saját jegyei
- `get_my_subjects`: nincs paraméter → HALLGATO/OKTATO aktuális tárgyai
- `get_my_schedule`: `{ "day_of_week": string? }` → saját órarend
- `get_my_homework`: `{ "status": "pending"|"submitted"|"graded"? }` → HALLGATO beadandói
- `get_class_average`: `{ "class_id": int, "subject_id": int }` → OKTATO/ADMIN
- `get_upcoming_events`: nincs paraméter → látható események
- `get_unread_messages`: nincs paraméter → olvasatlan üzenetek számossága

A tool végrehajtás `app/tools/handlers.py`-ban: a felhasználó JWT-jét továbbadva hív a monolitra.

### 6. Monolith client

`app/tools/monolith_client.py`:
```python
class MonolithClient:
    def __init__(self, base_url: str, jwt: str):
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {jwt}"},
            timeout=10.0,
        )

    async def get_my_grades(self, subject_id: int | None = None) -> list[dict]:
        params = {"subjectId": subject_id} if subject_id else {}
        r = await self.client.get("/api/grades/me", params=params)
        r.raise_for_status()
        return r.json()
    # ... többi
```

Resilience: 3x retry exponential backoff, timeout 10s, circuit breaker opcionális (`tenacity` lib).

### 7. SSE streaming

`app/chat/routes.py`:
```python
from sse_starlette.sse import EventSourceResponse

@router.post("/chat/stream")
async def stream_chat(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    jwt: str = Depends(get_raw_jwt),
):
    async def event_generator():
        async for event in chat_service.stream(request, user, jwt):
            yield {"event": event.type, "data": event.data}
    return EventSourceResponse(event_generator())
```

A `chat_service.stream` egy multi-turn agent loop:
1. Hívja Claude-ot a history-val
2. Ha tool_use jön, futtatja, eredményt visszaadja Claude-nak
3. Streameli a szöveges válaszdarabokat
4. Menti az új üzeneteket a DB-be

Eseménytípusok: `start`, `text_chunk`, `tool_use_start`, `tool_use_result`, `end`, `error`.

### 8. Persistence

`app/persistence/models.py` SQLAlchemy:

- `Conversation`: id, user_id, started_at, last_activity_at
- `Message`: id, conversation_id, role (user|assistant|tool), content (text), tool_calls_json, created_at
- `Document`: id, title, source, content
- `DocumentChunk`: id, document_id, chunk (text), embedding (vector(1024))

Alembic migration init, schema név: `chatbot` (külön schema az izoláció miatt).

### 9. RAG (egyszerűsített)

- Embed: `text-embedding-3-small` (OpenAI) **vagy** local `sentence-transformers/multilingual-e5-small` (ingyenes, kisebb dimenzió)
- Ingest endpoint: `POST /admin/rag/documents` — title + content, chunk-olja, embed, ment
- Search: vector cosine + BM25 (Postgres `tsvector`) hibrid
- Egy tool: `search_school_docs(query: str)` — szabálytalan oldalakon (házirend, leírás)

Ha nincs idő: hagyd ki, csak a fenti tool-okat add hozzá tool use-szal.

### 10. Health + Observability

- `GET /health` → 200 ha DB+Claude API elérhető
- `GET /metrics` (prometheus_client opcionális)
- structlog JSON output
- traceId propagáció a `X-Request-Id` header-ből

### 11. Dockerfile

Multi-stage, slim image, non-root user:
```dockerfile
FROM python:3.12-slim AS builder
# ... uv vagy pip install
FROM python:3.12-slim
COPY --from=builder ...
USER 1000
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 12. docker-compose.yml hozzáadás

A `# CHATBOT_SERVICE_PLACEHOLDER` jelölő helyére:

```yaml
  chatbot:
    build: ./chatbot
    container_name: portal-chatbot
    environment:
      DATABASE_URL: postgresql+asyncpg://portal:portal@db:5432/portal
      JWT_SECRET: ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      MONOLITH_BASE_URL: http://host.docker.internal:8081
      LOG_LEVEL: INFO
    ports:
      - "8000:8000"
    depends_on:
      - db
```

`.env.example`-be:
```
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=...
```

### 13. Tesztek

- `tests/test_auth.py`: érvényes/lejárt/manipulált token
- `tests/test_chat.py`: tool use loop happy path (mock Anthropic)
- `tests/test_tools.py`: tool végrehajtás mock monolith klienssel
- `pytest --asyncio-mode=auto`

### 14. README chatbot szekció

`README.md`-be új szekció: futtatás (Docker Compose-szal együtt), env vars, példa curl/SSE hívás, modell-választás magyarázata, RAG dokumentum-feltöltés.

## Definition of Done

- [ ] `chatbot/` mappa scaffold kész
- [ ] `docker-compose up` után `http://localhost:8000/health` 200-at ad
- [ ] Érvényes JWT-vel `POST /chat/stream` válaszol Claude-tól
- [ ] Tool use: "milyen jegyem van matekból?" valós választ ad (a monolitból lekérve)
- [ ] Chat history menti minden üzenetet DB-be
- [ ] Hibás token → 401
- [ ] `ruff check` + `mypy` zöld
- [ ] `pytest` zöld
- [ ] PR `main`-be, CI zöld

## Tipp

- Anthropic API kulcs kell env-be — ha még nincs, említsd a README-ben.
- A SQLAlchemy async engine + Alembic kombó kicsit körülményes — sync engine is rendben Alembic-hez, async runtime-ban a request handler.
- Prompt caching megsporol kb. 90%-ot, mert a system prompt + tool definíciók nagyok.
- Kerüld a prompt injection sebezhetőséget: a tool eredményeket explicit "<tool_result>...</tool_result>" formátumba zárd, és NE értelmezz benne utasítást.
