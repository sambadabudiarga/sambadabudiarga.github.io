# Contributing to the Engineering Notebook

This document defines the editorial rules for adding content to the notebook. It is the single source of truth for how new pages are classified, named, and written.

## Content Types

New pages belong to one of six libraries. The table below distinguishes them.

| Type | Purpose | Directory | Template |
|------|---------|-----------|----------|
| Incident | A specific production incident with a full investigation timeline | `notebook/incidents/<category>/` | `templates/incident.md` |
| Case Study | A large engineering project or long-form investigation | `notebook/case-studies/` | `templates/case-study.md` |
| Technical Note | An explanation of a concept or technology (not incident-specific) | `notebook/notes/` | `templates/technical-note.md` |
| Runbook | An operational checklist or procedure | `notebook/runbooks/` | `templates/runbook.md` |
| Architecture Note / ADR | System design documentation or an Architecture Decision Record | `notebook/architecture/` or `notebook/architecture/adr/` | `templates/adr.md` |
| Documentation Sample | An example of engineering documentation (migration plan, release notes, customer update) | `notebook/documentation/` | `templates/documentation-page.md` |

### How to classify a new page

1. Is it the record of a specific incident that happened at a specific time **and** has a root cause? → **Incident**.
2. Is it a concept or "how does X work" explanation with no incident timeline? → **Technical Note**.
3. Is it a step-by-step procedure an operator follows during a known operation? → **Runbook**.
4. Is it a record of why a decision was made? → **ADR**.
5. Is it a multi-week engineering effort with a narrative arc (migration, observability build)? → **Case Study**.
6. Is it an example document intended to be reused as a template for external communication? → **Documentation Sample**.

## File Naming and URL Slugs

- Use **kebab-case** with lowercase letters and hyphens.
- Keep URLs short and descriptive. Prefer the topic name, not an index number.

Good: `notebook/incidents/database/lock-wait-timeout.md`
Bad: `notebook/incidents/database/database-incident-example-007.md`

- Incident category folders are fixed. Do not create new category folders without updating the notebook sidebar in `docs/.vitepress/config.mts`.

## Frontmatter Requirements

### Incidents

```yaml
---
title: Human-readable incident title
summary: One or two sentence summary of the incident
date: YYYY-MM-DD
tags:
  - <technology or topic tag>
category: <incident category>
severity: <Critical | High | Medium | Low>
status: <Resolved | Monitoring | Open>
technologies:
  - <name>
systems:
  - <name>
estimated-reading-time: <integer minutes>
---
```

Tag dimensions: technology, layer, problem type, severity, and skill. Use multiple tags per entry.

### Case Studies

```yaml
---
title: Case study title
summary: One or two sentence summary
date: YYYY-MM-DD
tags: []
category: case-study
technologies: []
systems: []
estimated-reading-time: <integer minutes>
---
```

### Technical Notes

```yaml
---
title: Note title
summary: One or two sentence summary
date: YYYY-MM-DD
tags: []
technologies: []
estimated-reading-time: <integer minutes>
---
```

### Runbooks

```yaml
---
title: Runbook title
summary: When and how to use this runbook
date: YYYY-MM-DD
tags: []
category: runbook
---
```

### ADRs

```yaml
---
title: ADR title
date: YYYY-MM-DD
status: <Accepted | Superseded | Deprecated>
decision: One sentence summary of the decision
---
```

### Documentation Samples

```yaml
---
title: Sample document title
summary: What this sample demonstrates
date: YYYY-MM-DD
tags: []
category: documentation
---
```

## Required Heading Structure

### Incidents

1. `## Context` — systems, environment, what was supposed to happen
2. `## Symptoms` — observable behavior, error messages
3. `## Evidence` — logs, metrics, traces, configs (facts only)
4. `## Hypotheses` — possible causes considered
5. `## Timeline` — chronological record of investigation and actions
6. `## Experiments` — what was tried and what each test showed
7. `## Dead Ends` — hypotheses that were ruled out and why
8. `## Technical Findings` — what the evidence revealed
9. `## Root Cause` — the verified cause
10. `## Resolution` — what fixed it
11. `## Verification` — how the fix was confirmed
12. `## Prevention` — changes to avoid recurrence
13. `## Lessons Learned` — what would be done differently
14. `## Technologies` — list of relevant technologies
15. `## References` — links, tickets, docs

### Runbooks

1. `## When To Use`
2. `## Prerequisites`
3. `## Steps` (numbered)
4. `## Rollback`
5. `## Verification`
6. `## Escalation`

### ADRs

1. `## Status`
2. `## Context` — the problem and constraints
3. `## Decision` — what was decided
4. `## Consequences` — tradeoffs, costs, and benefits
5. `## Alternatives Considered`

## Redaction Rules

- Remove or replace any customer-identifying information, credentials, and secrets.
- Replace real hostnames with placeholders where they are not essential to the lesson.
- Do not publish internal-only business context.
- When in doubt, redact.

## Lessons Learned Writing Rules

- Write about what was learned, not who was at fault.
- Never blame individuals or teams.
- Frame lessons as improvements to process, tooling, or communication.
- Use first-person plural ("we") or impersonal phrasing.

## Search

Phase 1 uses the default VitePress local search (enabled in `docs/.vitepress/config.mts`). No third-party search plugin is used. Good frontmatter tags and summaries make search results more useful.

## Templates

All templates live in `docs/templates/`. Do not duplicate a template inside a category folder. Copy the relevant template into a new article file when authoring content.