# WhoBuiltThisRoad

A public lookup tool that tells you who built any road, how much public money was spent, who is accountable, and whether the warranty is still active — all sourced from government records.

**Start with Bengaluru, India.** Every road built using public money has a paper trail — sanction orders, tenders, work orders, contractors, engineers, and defect liability periods. This information is public but locked inside government portals and PDFs. WhoBuiltThisRoad makes it accessible to every citizen.

- **v0.2.0 — Backend API:** Search, road profiles, ward listing, CORS. [View on GitHub](https://github.com/AbhishekBalija/WhoBuiltThisRoad/releases)
- **v0.1.0 — Data Foundation:** 408 road records parsed, normalized, and loaded.
- **Deployment:** Live at [who-built-this-road.vercel.app](https://who-built-this-road.vercel.app/) — health endpoint verified at `/api/health`

## The Problem

When a road develops potholes three months after construction, citizens are angry but helpless. They don't know who built it, whether the warranty is still active, which engineer signed off, or how much was spent. That information exists — it sits inside government portals that most citizens will never find.

## What This Is Not

This is not a pothole reporting app. Not a complaint portal. Not a grievance filing system. It does one thing: connect a road to its public record.

## Status

**v0.2.0 — Backend API complete.** Search, road profile, ward listing, and CORS endpoints deployed. Week 3 (frontend) is next.

## API

All endpoints are available at `https://who-built-this-road.vercel.app/api/`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — returns `{"status":"ok"}` |
| `GET` | `/roads/search?q={query}` | Search roads by name (≥3 chars). Uses trigram similarity. |
| `GET` | `/roads/:slug` | Full road profile with work orders and DLP status. |
| `GET` | `/wards` | List all wards that have roads in the database. |
| `GET` | `/wards/:wardNumber/roads` | List roads in a specific ward. |

Response shapes, error codes, and examples are documented in the [GitHub release](https://github.com/AbhishekBalija/WhoBuiltThisRoad/releases).

## Tech Stack

| Layer | MVP |
|---|---|
| Frontend | React + Leaflet |
| Backend | Go (Gin) |
| Database | PostgreSQL (Neon) |
| ETL | Python |
| Hosting | Vercel (single project, multi-service) |

## Project Structure

```
backend/       — Go API server
frontend/      — React web app
etl/           — Python data pipelines
docs/          — Planning docs (local-only)
.agents/       — Agent memory files (local-only)
```

## Contributing

This project is in its early stages. If you're interested in civic tech, open government data, or road infrastructure in India, [open an issue](https://github.com/AbhishekBalija/WhoBuiltThisRoad/issues) or reach out.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE).
