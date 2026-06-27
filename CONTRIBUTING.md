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
4. Run any existing tests: `npm test` or `go test ./...`
5. Push and open a PR

## Development Setup

The short version of the dev setup:

```bash
# Backend
cd backend
go run cmd/server/main.go

# Frontend
cd frontend
npm install
npm run dev

# ETL
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
