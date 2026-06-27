# v0.1.0 — Data Foundation

**2026-06-28**

This is the first milestone release of WhoBuiltThisRoad. The data pipeline is complete and verified: 408 road records parsed, normalized, and loaded into production PostgreSQL (Neon).

## What's New

### Parser Engine (etl/parsers/)
- 4 strategy-named builders with a registry (Continuation → ThreeRow → MixedLayout → SingleRow fallback)
- Page inspector detects division, serial gaps, and column layout (10/12/16/30-col)
- ContinuationExtractor handles multi-row road names with column-shift detection
- MixedLayoutBuilder segments pages at gap-change boundaries (handles Bommanahalli hybrid pages)
- ParseReport serialises per-run quality metrics to JSON for regression tracking

### Road Name Normalizer (etl/normalizers/)
- `normalize_road_name()` standardizes Rd→Road, St→Street, 100ft variants
- `generate_slug()` produces URL-safe, deduplicated slugs
- 0 duplicate slugs across all 408 records

### Database Loader (etl/loaders/)
- Idempotent upsert with UNIQUE (road_id, source_document) constraint
- `_parse_float` caps road length at 100km (catches phone-number leaks from source PDF)
- 408 roads + 408 work orders loaded into Neon

### Automated Test Suite (etl/tests/)
- 127 tests across all pipeline components
- Pipeline integration test re-parses the PDF and asserts the quality gate
- Regression check against previous report.json

## Data Quality

| Metric | Value |
|---|---|
| Records parsed | 408 |
| Validation success | 99.3% |
| Unknown layouts | 0 |
| Empty road names | 0 |
| Duplicate slugs | 0 |
| Divisions covered | 8 of 8 (East, West, South, Dasarahalli, Yelahanka, RR Nagar, Mahadevapura, Bommanahalli) |
| Contractors recorded | 58 unique (across 105 populated records) |
| Spot-check | 10/10 verified against source PDF |

## Known Limitations

- 3 source-data warnings (South serials 42, 50, 51 — column-shifted continuation data)
- 5 duplicate serials in Mahadevapura (source PDF has two separate tables within one division)
- 1 phone-number-in-length_km (South serial 5 — caught and stored as NULL)
- 74.3% NULL contractors (source PDF rows have no "Name of Agency" filled in)
- BBMP Works Bill portal inaccessible from outside India

## Tech Stack

- **Frontend:** React + Vite + TypeScript (scaffolded)
- **Backend:** Go (Gin) — health endpoint ready
- **Database:** PostgreSQL on Neon — roads + work_orders schema
- **ETL:** Python — pdfplumber, psycopg2
