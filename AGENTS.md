# Agent Memory System — Auto-Maintenance Rules

This project uses `.agents/` as its living memory. Every session starts by reading and ends by updating these files. The agent **must** maintain them automatically — never store info only in conversation context.

## Code Discovery — Use the Knowledge Graph First

This project is indexed with **codebase-memory-mcp** (271 nodes, 276 edges). The knowledge graph lives in `.codebase-memory/graph.db.zst`.

**Always** use MCP graph tools before falling back to grep/glob:

| Tool | When to use |
|---|---|
| `search_graph` | Find functions, classes, routes by name or query |
| `trace_path` | Who calls this function? What does it call? |
| `get_code_snippet` | Read source of a specific function/class |
| `query_graph` | Complex Cypher queries (cross-service, hot paths) |
| `get_architecture` | High-level project structure overview |

**Fall back to grep/glob only for:** string literals, error messages, config values, non-code files (Dockerfiles, shell scripts). The graph catches structural relationships (callers, callees, routes, data flows) that grep cannot see.

## Auto-Update Triggers

| Event | File(s) to update | Action |
|---|---|---|
| Session start | `SESSION_LOG.md`, `NEXT_STEPS.md` | Read both for context |
| Decision made (arch, product, process) | `DECISIONS.md` | Append: date, decision, context, alternatives considered |
| Bug / data quality issue found | `KNOWN_ISSUES.md` | Append: description, severity, where found |
| Lesson learned (something went wrong or surprised) | `LESSONS_LEARNED.md` | Append: what happened, why, how to avoid |
| Task completed (from IMPLEMENTATION.md) | `DONE.md`, `CHANGELOG.md` | Move from NEXT_STEPS to DONE; log in CHANGELOG with date |
| Feature idea / improvement thought | `IDEAS.md` | Append immediately while fresh |
| Open question arises | `QUESTIONS.md` | Append with context |
| Test run | `TEST_RESULTS.md` | Log: what was tested, result, date |
| Data source status changes | `DATA_SOURCES.md` | Update status column |
| Phase / milestone status changes | `ROADMAP.md`, `PROJECT_STATUS.md` | Update both |
| Session end | `SESSION_LOG.md`, `PROJECT_STATUS.md`, `NEXT_STEPS.md` | Log summary, update status, refresh next steps |

## File Roles

| File | Purpose | When to read | When to write |
|---|---|---|---|
| `PROJECT_STATUS.md` | One-page snapshot of where the project stands | Every session start | Every session end |
| `NEXT_STEPS.md` | Ordered list of what to work on next | Every session start | Every session end |
| `SESSION_LOG.md` | Raw log of what happened each session | Start of session | End of session |
| `CHANGELOG.md` | Chronological record of completed work | When onboarding | When a task completes |
| `DECISIONS.md` | Why things are the way they are | When questioning past choices | When a decision is made |
| `LESSONS_LEARNED.md` | What went wrong and how to avoid it | When encountering familiar problem | When something surprises |
| `KNOWN_ISSUES.md` | Bugs, data gaps, technical debt | Before planning work | When discovered |
| `DONE.md` | Completed tasks (from IMPLEMENTATION.md) | When checking status | When task completes |
| `ROADMAP.md` | High-level phased plan | Weekly review | When phase/milestone changes |
| `DATA_SOURCES.md` | All data sources with ingestion status | Before data work | When source status changes |
| `TERMINOLOGY.md` | Domain terms and acronyms | When encountering unfamiliar term | When learning a new term |
| `TEST_RESULTS.md` | Test outcomes | Before deployment | After running tests |
| `QUESTIONS.md` | Open questions needing answers | When stuck | When new question arises |
| `IDEAS.md` | Feature ideas and improvements | When deciding what to build | When inspiration strikes |
| `AGENT_RULES.md` | Rules the agent must follow | Always | When new rule is needed |
| `PROMPTS.md` | Useful prompts and command snippets | When repeating a task | When a useful pattern emerges |

## Rules for the Agent

1. **Read before you write.** Always read `NEXT_STEPS.md` and `PROJECT_STATUS.md` at session start.
2. **Write immediately.** When a trigger event happens, update the file within the same tool call batch. Do not batch updates for later.
3. **Be specific.** In DECISIONS.md, include alternatives considered and why they were rejected. In KNOWN_ISSUES.md, include reproduction steps or file/line references.
4. **Keep it current.** If a DECISIONS.md entry becomes outdated, add a new entry superseding it. Do not edit history.
5. **Session end is mandatory.** Before the final message, always update SESSION_LOG.md, PROJECT_STATUS.md, and NEXT_STEPS.md.
