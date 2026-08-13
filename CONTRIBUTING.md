# Contributing

Thanks for your interest. This project is in its early stages and every contribution helps.

## How to Contribute

### Report a Bug

Open an issue with:
- What you expected
- What actually happened
- Steps to reproduce (if applicable)

### Suggest a Feature

Open an issue describing:
- The problem you're trying to solve
- Why existing tools don't solve it
- How this project could help

### Contribute Code

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run the relevant frontend, backend, or ETL tests
5. Push and open a PR

## Development Setup

Install the frontend dependencies once:

```bash
cd frontend
bun install
cd ..
```

Then start the complete application from the repository root:

```bash
bun run dev
```

This starts the Go API on port `8080` and the Vite frontend on port `5173`. Press `Ctrl+C` once to stop both.

Run a single service when needed:

```bash
bun run dev:backend
bun run dev:frontend
```

Set up the ETL environment separately:

```bash
cd etl
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Guidelines

- Write clean, idiomatic Go/Python/React — match existing style
- Every piece of data must trace back to a government source
- No LLM calls in the search path — PostgreSQL trigram search is fast enough
- No real-time scraping on user requests — all data comes from the pre-loaded database
- Keep it simple — no authentication in MVP

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful, assume good faith, and focus on the work.
