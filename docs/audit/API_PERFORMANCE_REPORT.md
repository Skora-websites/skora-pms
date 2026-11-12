# API Performance Report — SkoraCares

**Audit date:** 2026-11-12  
**Method:** Static code review (Next.js dev server not running — no live latency measurements)  
**Note:** All latency characterizations are estimates based on query complexity, index analysis, and architectural review. Live measurements must be taken with MySQL running and the Next.js dev server started.

---

## 1. Performance Targets

| API Category | Target P50 | Target P95 | Target P99 |
|---|---|---|---|
| Health check | < 5 ms | < 10 ms | < 20 ms |
| Simple reads (single table, indexed) | < 100 ms | < 300 ms | < 500 ms |
| Standard CRUD (1–3 joins) | < 200 ms | < 500 ms | < 1,000 ms |
| Complex reads (4+ joins, pagination) | < 400 ms | < 1,000 ms | < 2,000 ms |
| PDF generation | < 500 ms | < 1,500 ms | < 3,000 ms |
| CSV/XLSX export (< 1,000 rows) | < 500 ms | < 2,000 ms | < 5,000 ms |
| Integration proxies (external API) | < 500 ms | < 2,000 ms | < 8,000 ms |
| SSE streams | Connection: < 100 ms; event delivery: near-real-time |
| File serving (< 5 MB) | < 50 ms | < 200 ms | < 500 ms |
| AI summarization | < 3,000 ms | < 10,000 ms | < 30,000 ms |

---

## 2. Database Pool Configuration

**Configuration:** `lib/db/index.ts`, tunable via environment variables

```
DB_POOL_CONNECTION_LIMIT   default 10
DB_POOL_QUEUE_LIMIT        default 0 (unlimited)
DB_CONNECT_TIMEOUT         default 10,000 ms
```

**Analysis:**
- Pool size of 10 is appropriate for a single aaPanel box serving a clinic PMS with moderate concurrent users.
- `DB_POOL_QUEUE_LIMIT=0` (unlimited queue) means the pool will never reject connections during spikes — requests wait instead. This is safer than dropping requests but means memory usage can grow during traffic bursts.
- For higher concurrency (50+ concurrent users), consider setting `DB_POOL_QUEUE_LIMIT=50` and monitoring queue depth.
- `DB_CONNECT_TIMEOUT=10s` is generous; for production, 3–5 seconds is more appropriate to surface DB issues quickly.

**Recommendation:** Set `DB_CONNECT_TIMEOUT=5000` and monitor queue depth with the MySQL slow query log.

---

## 3. Query Pattern Analysis

### 3.1 Fast paths (< 100 ms expected)

| Endpoint | Why Fast |
|---|---|
| `GET /api/health` | Static JSON, no DB |
| `GET /api/integrations/*` | External proxy with timeout guard; no DB |
| `GET /api/medicines/search` | Indexed text search on `medicines` table |
| `GET /api/integrations/india` | Local snapshot fallback; no DB |
| `GET /api/doctor/test-bookings/suggestions` | Indexed lookup |

### 3.2 Standard paths (100–400 ms expected)

| Endpoint | Query Complexity |
|---|---|
| `GET /api/patient/available-slots` | 2–3 joins (schedules, appointments, holidays). Well-indexed on `doctor_id` + `date`. |
| `GET /api/mobile/patient/appointments` | 2 joins. Paginated. |
| `GET /api/mobile/doctor/patients` | Practice-scoped, paginated. |
| `GET /api/mobile/admin/appointments` | Business-scoped via `business_clinics` join; 3–4 tables. |
| `GET /api/doctor/staff/attendance` | Clinic-scoped, date-filtered. |

### 3.3 Complex paths (400 ms – 1.5 s expected)

| Endpoint | Why Complex |
|---|---|
| `GET /api/mobile/admin/home` | Aggregation across appointments, billings, clinics for dashboard metrics. |
| `GET /api/mobile/super/stats` | Platform-wide aggregations across all tenants. |
| `GET /api/doctor/staff/attendance/report` | Date-range aggregation with export formatting. |
| `POST /api/patient/test-reports/[id]/summarize` | AI provider call adds ~2–10 s depending on provider. |

### 3.4 Heavy paths (1.5 s – 5 s expected)

| Endpoint | Why Heavy |
|---|---|
| `GET /api/doctor/appointments/export` | Full table scan of practice appointments (CSV/XLSX). Acceptable for async export. |
| `GET /api/doctor/patients/export` | Full patient list export. |
| `GET /api/doctor/income-expense/export` | Financial record export. |
| `GET /api/doctor/billing/[id]/pdf` | PDF rendering via `@react-pdf/renderer` (CPU-bound). |
| `GET /api/doctor/consult-pdf` | PDF rendering. |

---

## 4. N+1 Query Risk Assessment

**Code review finding:** No confirmed N+1 patterns found. Data access is routed through named query functions in `lib/queries/*` rather than ad-hoc per-record lookups in route handlers.

**Examples of correct batching:**
- `lib/queries/available-slots.ts` — fetches all existing appointments for the target date range in one query before computing free slots.
- Dispatch ranking (`lib/dispatch/ranking.ts`) — fetches all candidate doctors and their locations in one query.
- Mobile patient home — returns aggregated counts, not lists of items.

**Risk areas to watch during load testing:**
- PDF generation routes that may load related consultation data in multiple separate queries. Verify with slow query log.
- Super-admin stats if it aggregates across many tenants without a covering index.

---

## 5. Streaming Endpoints (SSE)

| Endpoint | Implementation |
|---|---|
| `GET /api/patient/sos/stream` | SSE from in-process `globalThis` SOS hub |
| `GET /api/doctor/sos/stream` | SSE from same hub, different subscription filter |

**Architecture:** The SOS hub is stored on `globalThis` to survive Next.js module hot-reloading, which would otherwise create multiple hub instances. This is documented in the codebase and is the correct approach for a single-process deployment.

**Performance characteristics:**
- Connections are long-lived (minutes to hours during an active SOS case).
- Each connection consumes a Node.js HTTP connection handle.
- For 50 concurrent SOS cases (100 connections: 50 patients + 50 doctors): negligible resource overhead.
- For > 500 concurrent connections: Redis pub/sub would be needed to distribute the hub across multiple processes.

**Recommendation:** Monitor connection count during SOS drills. Set `connection: keep-alive` and appropriate SSE timeout/heartbeat.

---

## 6. File Serving Performance

**Static files from `storage/`:** All file-serving routes use:
- `Cache-Control: immutable` for public assets.
- `Cache-Control: no-store, private` for PHI files.
- Node.js `ReadableStream` piped directly — no intermediate buffering.

**Expected performance:** Files < 5 MB served in < 100 ms on local disk. Performance degrades if `storage/` is on a network mount.

**PDF generation:** `@react-pdf/renderer` is CPU-bound. Each PDF request blocks the event loop thread for 100–500 ms. For high-concurrency PDF requests, consider:
1. Caching generated PDFs (checksum of inputs → cached file path).
2. Moving PDF generation to a background worker or queue.

---

## 7. Rate Limiting Overhead

**Overhead per request:** `lib/security/rate-limit.ts`  
- In-memory: < 1 ms (Map lookup + atomic increment).
- Redis: 2–5 ms per round-trip (sliding window via ZADD + ZRANGEBYSCORE).

This overhead is negligible relative to DB query time.

---

## 8. Integration Proxy Timeouts

External API calls are guarded with `PUBLIC_API_TIMEOUT_MS` (default 8,000 ms). All integration routes degrade gracefully on upstream failure — either returning a local fallback or returning an empty result.

**Risk:** 8-second timeout means a slow external API will hold a Node.js request for 8 seconds. Under high concurrency this could exhaust the connection pool. 

**Recommendation:** Reduce `PUBLIC_API_TIMEOUT_MS` to 3,000 ms for production. The local snapshot fallbacks make this safe for clinical data endpoints.

---

## 9. Load Testing Recommendations

**Prerequisites:** MySQL running, Next.js dev server started.

**Recommended tools:** `k6` or `artillery` (both have no-install binary options).

**Test scenarios:**

### Scenario 1 — Appointment booking flow (critical path)
```
GET  /api/patient/available-slots  — 50 concurrent
POST /api/mobile/patient/appointments — 25 concurrent
```
Watch for: slot conflict handling under concurrency, DB lock contention.

### Scenario 2 — Doctor dashboard read (sustained)
```
GET /api/mobile/doctor/home — 100 concurrent, 60 seconds
```
Watch for: query time degradation, pool queue depth.

### Scenario 3 — SOS dispatch (burst)
```
POST /api/mobile/emergency/requests — 10 concurrent, 1/min rate limit applies
```
Watch for: rate limit enforcement, hub broadcast latency.

### Scenario 4 — Export endpoints (heavy)
```
GET /api/doctor/appointments/export — 5 concurrent
GET /api/doctor/patients/export — 5 concurrent
```
Watch for: memory usage (exceljs buffers large XLSX in memory), response time.

### Scenario 5 — Integration proxies (external dependency)
```
GET /api/integrations/india — 20 concurrent
```
Watch for: external API rate limit, timeout behavior, fallback activation.

---

## 10. Recommended Performance Instrumentation

For production, add:
1. **Response time logging** per route (middleware or Next.js instrumentation hook).
2. **MySQL slow query log** (`long_query_time=0.5` seconds).
3. **Pool queue depth monitoring** via mysql2 pool events.
4. **Node.js heap metrics** via `process.memoryUsage()` or a monitoring agent (Datadog, Grafana).
