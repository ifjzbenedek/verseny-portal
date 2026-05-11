# Architectural Decision Records

Az ADR rövid, kontextushoz kötött feljegyzés egy fontos technikai döntésről: mit választottunk, miért, és mi a következménye.

## Lista

| Sorszám | Cím | Státusz |
|---------|-----|---------|
| [0001](0001-modular-monolith.md) | Modular monolit Spring Modulith-tal | Accepted |
| [0002](0002-chatbot-as-microservice.md) | Chatbot különálló Python service-ként | Proposed |
| [0003](0003-jwt-based-auth.md) | JWT-alapú stateless authentikáció | Accepted |

## Sablon

```markdown
# ADR-NNNN: Cím

**Státusz:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
**Dátum:** YYYY-MM-DD

## Kontextus
Mi a probléma, milyen környezetben merül fel?

## Döntés
Mit választottunk?

## Indoklás
Miért ezt választottuk a többi lehetőséggel szemben?

## Következmények
**Pozitív:**
- ...

**Negatív, kompromisszum:**
- ...

## Alternatívák
- A: mi és miért nem
- B: mi és miért nem
```
