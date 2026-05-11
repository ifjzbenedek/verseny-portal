# ADR-0002: Chatbot különálló Python service-ként

**Státusz:** Proposed
**Dátum:** 2026-05-11

## Kontextus

A portálhoz tervezett asszisztens chatbot Anthropic Claude API-t hív, tool use-szal lekérdezi a felhasználó adatait, és streamelve válaszol. Az LLM hívások lassúak (öt-harminc másodperc), Python ökoszisztémája gazdagabb az AI eszközökben (SDK, embeddings, pgvector). Felmerül a kérdés, hogy ez a komponens a Java monolitba kerüljön, vagy különálljon.

## Döntés

A chatbot különálló Python (FastAPI) service lesz. Ugyanazon Postgres adatbázist használja külön sémában, a felhasználói JWT-t a monolittal megosztott titokkal validálja, a monolith REST API-jából pedig úgy húz adatot, hogy a kapott JWT-t továbbküldi.

## Indoklás

- A Java AI ökoszisztéma szegényesebb. Python oldalon az Anthropic SDK, pgvector binding és embeddings modellek könnyebben elérhetők.
- Az LLM hívás blokkolná a monolit thread pool-ját. Külön processz külön thread pool, a portál többi része nem érzi meg.
- Hibaizoláció: ha az Anthropic API leáll, a portál többi része működik tovább.
- Az SSE streaming és a tool use loop önálló protokoll. Egy különálló service-ben tisztábban élhet.

## Következmények

**Pozitív:**
- Független skálázás (LLM forgalom szerint).
- Failure isolation.
- Tisztább kódbázis (Python AI rétegek nem keverednek Java üzleti logikával).

**Negatív, kompromisszum:**
- Két nyelv, két dependency-fa, két CI pipeline.
- A monolit JWT secretjét meg kell osztani (egyelőre HS256, későbbi cél JWKS-szel RS256-ra váltani).
- Cross-service hívás latency overhead (egy chat válasz a monolitnak több REST kört jelenthet).

## Alternatívák

- **Java oldali integráció (LangChain4j vagy közvetlen HTTP):** elvetve, mert blokkolja a monolit thread pool-ját, és a Python ökoszisztéma érettebb.
- **Külön processz, de szintén Java:** elvetve, mert az AI eszköztámogatás Pythonban erősebb.
