# E — DevOps & Observability

> **Indulás előtt**: [00-FOUNDATION.md](00-FOUNDATION.md) merged `main`-be. `git pull`.
> Párhuzamosan futhat A/B/C/D-vel, de a saját mappáin dolgozik, így nincs konfliktus.

## Cél

Production-grade DevOps + observability infrastruktúra: GitHub Actions CI pipeline, Helm chart Kubernetes deployhoz, Prometheus + Grafana + Loki + Tempo observability stack, egészségellenőrzések, Docker image optimalizáció, secret management dokumentáció.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/devops-observability
```

## Tulajdonolt fájlok (kizárólag)

- `.github/` (új mappa)
- `k8s/` (új mappa)
- `docker-compose.observability.yml` (új)
- `observability/` (új mappa: Grafana dashboards, Prometheus config, Loki config)
- `backend/Dockerfile` (multi-stage refactor — koordinálj A-val ha párhuzamosan túr)
- `frontend/Dockerfile` (új vagy refactor)
- `chatbot/Dockerfile` (csak ha létezik — koordinálj C-vel)

## TILOS érinteni

- `backend/src/` (kivéve Actuator config az `application.yml`-ben — koordinálj A-val)
- `frontend/src/`
- `chatbot/app/`
- `mobile/`
- `TERV.md`, `CLAUDE.md`, `TASKS/*`

## Deliverables

### 1. GitHub Actions CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: portal_test
          POSTGRES_USER: portal
          POSTGRES_PASSWORD: portal
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin', cache: 'maven' }
      - run: cd backend && mvn -B verify
      - run: cd backend && mvn spotless:check
      - uses: codecov/codecov-action@v4
        with: { files: backend/target/site/jacoco/jacoco.xml }

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: 'frontend/package-lock.json' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run typecheck
      - run: cd frontend && npm test -- --run
      - run: cd frontend && npm run build

  chatbot:
    runs-on: ubuntu-latest
    if: hashFiles('chatbot/pyproject.toml') != ''
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: cd chatbot && pip install -e ".[dev]"
      - run: cd chatbot && ruff check .
      - run: cd chatbot && mypy app
      - run: cd chatbot && pytest

  docker-build:
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - run: docker build -t portal-backend:ci backend/
      - run: docker build -t portal-frontend:ci frontend/
```

### 2. Security scan workflow

`.github/workflows/security-scan.yml`:

```yaml
name: Security
on:
  schedule:
    - cron: '0 6 * * 1'   # heti, hétfő reggel
  workflow_dispatch:

jobs:
  owasp-dep-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: cd backend && mvn org.owasp:dependency-check-maven:check
      - uses: actions/upload-artifact@v4
        with:
          name: dependency-check-report
          path: backend/target/dependency-check-report.html

  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with: { scan-type: 'fs', severity: 'HIGH,CRITICAL' }

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm audit --audit-level=high
```

### 3. Release workflow

`.github/workflows/release.yml`:
- Trigger: tag push (`v*.*.*`)
- Build + push Docker images Docker Hub vagy GHCR-re
- Generate CHANGELOG.md (`conventional-changelog`)
- Create GitHub Release

### 4. PR template

`.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Mit változtat?
<!-- 1-2 mondat -->

## Miért?
<!-- üzleti / technikai indok -->

## Hogyan teszteltem?
- [ ] Unit teszt
- [ ] Integration teszt
- [ ] Manual smoke teszt
- [ ] Screenshot (UI változásnál)

## Checklist
- [ ] Conventional Commits
- [ ] Megfelelő modulnak van címezve
- [ ] Új public API: OpenAPI doc frissítve
- [ ] Új env var: README + docker-compose frissítve
- [ ] Breaking change: dokumentálva
```

### 5. Dependabot

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: maven
    directory: /backend
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
  - package-ecosystem: npm
    directory: /frontend
    schedule: { interval: weekly }
  - package-ecosystem: pip
    directory: /chatbot
    schedule: { interval: weekly }
  - package-ecosystem: docker
    directory: /backend
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

### 6. Multi-stage Dockerfile-ok

**`backend/Dockerfile`** (cseréld a meglévőt, ha nem multi-stage):

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
USER app
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD wget -q -O- http://localhost:8081/actuator/health/liveness || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

**`frontend/Dockerfile`** (új):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -q -O- http://localhost/ || exit 1
```

`frontend/nginx.conf`:
- Gzip + brotli
- SPA fallback: `try_files $uri $uri/ /index.html`
- Cache headers static asset-ekre
- `/api/` proxy a backend service-re

### 7. docker-compose.yml health check-ek

A meglévő `docker-compose.yml`-be tedd hozzá minden service-nek a `healthcheck` blokkot és `depends_on: condition: service_healthy`-t.

Db-re:
```yaml
db:
  image: postgres:15-alpine
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U portal -d portal"]
    interval: 5s
    timeout: 3s
    retries: 10
```

### 8. Observability docker-compose

`docker-compose.observability.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - ./observability/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./observability/grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports: ["3000:3000"]
    depends_on: [prometheus, loki]

  loki:
    image: grafana/loki:latest
    command: -config.file=/etc/loki/local-config.yaml
    ports: ["3100:3100"]

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./observability/promtail.yml:/etc/promtail/config.yml:ro
    depends_on: [loki]

  tempo:
    image: grafana/tempo:latest
    command: -config.file=/etc/tempo.yaml
    volumes:
      - ./observability/tempo.yml:/etc/tempo.yaml:ro
    ports: ["3200:3200", "4317:4317"]
```

Indítás: `docker-compose -f docker-compose.yml -f docker-compose.observability.yml up`.

### 9. Prometheus config

`observability/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: backend
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ['host.docker.internal:8081']

  - job_name: chatbot
    metrics_path: /metrics
    static_configs:
      - targets: ['host.docker.internal:8000']
```

### 10. Grafana provisioning

`observability/grafana/provisioning/datasources/datasources.yml`:
- Prometheus → http://prometheus:9090
- Loki → http://loki:3100
- Tempo → http://tempo:3200

`observability/grafana/dashboards/`:
- `backend-overview.json`: API latency p50/p95/p99, error rate, request rate
- `jvm.json`: heap, GC, threads
- `db-pool.json`: HikariCP metrics
- `chatbot.json`: token usage, tool calls, latency

(Vagy gyors megoldás: importáld a `4701` JVM dashboardot Grafana.com-ról a docs-ban.)

### 11. Helm chart

`k8s/chart/Chart.yaml`:

```yaml
apiVersion: v2
name: portal
version: 0.1.0
appVersion: "1.0"
dependencies:
  - name: postgresql
    version: "15.x.x"
    repository: https://charts.bitnami.com/bitnami
  - name: redis
    version: "19.x.x"
    repository: https://charts.bitnami.com/bitnami
```

`k8s/chart/values.yaml`: image tag-ek, replica count, resources, ingress, env, secrets

`k8s/chart/templates/`:
- `backend-deployment.yaml` + `backend-service.yaml` + `backend-hpa.yaml` (HPA CPU 70%-on)
- `frontend-deployment.yaml` + `frontend-service.yaml`
- `chatbot-deployment.yaml` + `chatbot-service.yaml`
- `ingress.yaml`
- `configmap.yaml`
- `secret.yaml` (példa, NEM véglegesítve)
- `pdb.yaml` (PodDisruptionBudget)
- `networkpolicy.yaml` (csak gateway → service traffic)
- `serviceaccount.yaml`

### 12. README "Deployment" szekció

`README.md`-be új szekció:
- Helm chart leírása
- `helm install portal k8s/chart -f values.prod.yaml`
- Secret management ajánlás (Vault / SealedSecrets / external-secrets)
- Production checklist (TLS, backup, monitoring alerts)

### 13. Backend Actuator config

`backend/src/main/resources/application.yml` (koordinálj Window A-val):

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
  metrics:
    distribution:
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
      sla:
        http.server.requests: 100ms, 500ms, 1s
  observations:
    annotations:
      enabled: true
  tracing:
    sampling:
      probability: 1.0
```

Függőségek a `pom.xml`-be (koordinálj A-val):
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

### 14. Logback JSON encoder

`backend/src/main/resources/logback-spring.xml`:

```xml
<configuration>
    <springProfile name="!local">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <includeMdcKeyName>traceId</includeMdcKeyName>
                <includeMdcKeyName>userId</includeMdcKeyName>
            </encoder>
        </appender>
        <root level="INFO"><appender-ref ref="JSON"/></root>
    </springProfile>
    <springProfile name="local">
        <include resource="org/springframework/boot/logging/logback/base.xml"/>
    </springProfile>
</configuration>
```

Függőség: `net.logstash.logback:logstash-logback-encoder:7.4`.

### 15. Sensitive data masking

`shared/observability/SensitiveDataMaskingConverter` Logback custom converter password/token mintákra.

### 16. Pre-commit (Husky) a repo gyökérben

`package.json` a gyökérben (új):

```json
{
  "private": true,
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

`.husky/pre-commit`: `npx lint-staged`
`.husky/commit-msg`: `npx commitlint --edit $1`

### 17. README badges + CI status

`README.md` tetejére:
- CI status badge
- Coverage badge
- License badge

## Definition of Done

- [ ] `.github/workflows/ci.yml` zöldre fut PR-en
- [ ] Multi-stage Dockerfile-ok kisebbek (`docker images | grep portal`)
- [ ] `docker-compose -f docker-compose.yml -f docker-compose.observability.yml up` → Grafana elérhető http://localhost:3000-en
- [ ] Backend metrikák megjelennek Prometheus-ban
- [ ] Grafana dashboard mutat API latency-t és JVM-et
- [ ] Helm chart `helm lint k8s/chart` zöld
- [ ] Pre-commit hook fut (próbálj commitolni rossz formátummal → blokkol)
- [ ] Dependabot konfigurálva
- [ ] Security scan workflow lefutott legalább egyszer
- [ ] README frissítve "Deployment" + "Observability" szekciókkal
- [ ] PR `main`-be, CI zöld

## Koordináció más ablakokkal

- **Window A** (backend modulok): az Actuator config-ot az `application.yml`-ben **te tervezed**, de A is hozzányúl az `application.yml`-hez. Két opció:
  - (a) Külön config fájl: `application-observability.yml`, profile-lal aktiválva
  - (b) Sync chaten — egyiktek csinálja, másik mergeli

- **Window B** (frontend): a `frontend/Dockerfile`-t te csinálod (B nem nyúl hozzá Dockerfile-hoz, csak `src/`-hoz)

- **Window C** (chatbot): C írja a `chatbot/Dockerfile`-t maga; te csak validálod hogy multi-stage és healthcheck van benne

## Tipp

- A Grafana dashboard import-ját megspórolhatod: a JSON-t a `grafana.com/grafana/dashboards`-ról letöltheted (pl. JVM Micrometer Dashboard ID: 4701).
- Helm chart fejlesztéséhez használj `helm template` parancsot a render előtt.
- Logback JSON encoder helyett `spring-boot-starter-logging`-mal `logging.structured.format.console: ecs` (Spring Boot 3.4+) is jó, de a 3.2-ben még a logstash encoder kell.
