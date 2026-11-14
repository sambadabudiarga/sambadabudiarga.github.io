# Engineering Notebook

Production troubleshooting, root cause analysis, and operational lessons from real-world systems.

A collection of production investigations, engineering notes, runbooks, and lessons learned from systems I've worked with over the past decade.

---

## Areas of Investigation

- **API & Backend** — Issues in Laravel, Node.js, or custom API logic. Tracing failures from request to response.
- **Infrastructure & Linux** — Docker, Nginx, server configuration, OS migration. The layer between the code and the hardware.
- **Database & Storage** — MySQL, SQL Server, PostgreSQL. Locks, replication, corruption, and queries that don't scale.
- **Integrations** — Zoho CRM, Xero, Twilio, WhatsApp. Webhooks, rate limits, silent sync failures, undocumented behavior.
- **Performance & Reliability** — Bottlenecks, memory usage, slow deployments, and measuring what matters.
- **Security & Access** — SSL/TLS, authentication misconfigurations, credential leaks, access control gaps.
- **CI/CD & Deployment** — Pipeline failures, artifact handling, environment drift, and the difference between "it works locally" and "it works in production."

---

## The Notebook

- [Incident Library](/notebook/incidents/) — Full investigations with timeline, evidence, root cause, and prevention.
- [Case Studies](/notebook/case-studies/) — Long-form engineering reports covering migrations, observability builds, and large-scale debugging.

---

## About This Notebook

This notebook records what I've learned from investigating production incidents across the stack. Every entry documents what happened, what was found, and what was learned — not to show off, but because writing it down makes the next investigation faster, and sharing it makes the team stronger.