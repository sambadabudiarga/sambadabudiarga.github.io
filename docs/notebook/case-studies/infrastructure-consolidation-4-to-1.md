---
title: Infrastructure Consolidation — 4 Servers to 1
summary: A phased migration consolidating 18 applications from 4 legacy servers into a single containerized platform, reducing hosting costs by roughly 45% and simplifying maintenance.
date: 2026-08-05
tags:
  - infrastructure
  - migration
  - docker
  - cost-optimization
  - ssl
  - zoho
category: case-study
technologies:
  - Docker
  - Nginx
  - PHP
  - Apache
  - Zoho Analytics
  - Alibaba Cloud
  - Ubuntu
  - CentOS
systems:
  - LogixOne Chat
  - Zoho Analytics On-Premise
  - Internal business applications
estimated-reading-time: 8
---

# Infrastructure Consolidation — 4 Servers to 1

## Background

We were running 4 servers, each serving a different purpose:

- **Server A** — Main application server hosting the bulk of internal business apps.
- **Server B** — On-premise Zoho Analytics instance.
- **Server C** — LogixOne Chat frontend (HTML, JS, CSS, minimal PHP).
- **Server D** — LogixOne Chat backend (PHP 8.2 on Apache).

No single server had issues on its own. The "don't fix what's not broken" principle was in play — partly out of pragmatism, partly because there wasn't bandwidth for a migration nobody was asking for.

But the monthly bills kept climbing. SSL certificate renewals meant running the same cert update across 3 different servers (we were still using Komodo), which was tedious and error-prone. Eventually the costs became impossible to ignore, and the proposal to consolidate was approved.

## Objectives

- Reduce monthly hosting costs without sacrificing stability.
- Simplify maintenance — fewer servers means fewer SSL updates, fewer OS patches, fewer things to remember.
- Migrate with minimal downtime for each service.

## Approach

The migration was executed in phases, starting with the simplest service and working toward the most complex. This minimized risk and allowed us to validate the process incrementally.

### Phase 1: LogixOne Chat Frontend (Server C → Server A)

The frontend was straightforward — static assets with a small PHP layer. A simple rsync to Server A, no configuration changes. Total effort: minimal. This was the warm-up.

### Phase 2: Zoho Analytics On-Premise (Server B → Server A)

This service wasn't heavily used but consumed significant resources. We notified users in advance about scheduled downtime and **upsized Server A** (to 8 vCPU, 32 GB RAM) to ensure enough headroom before starting.

The file migration itself was just rsync again. But there was a problem I should have anticipated: **Zoho On-Premise licenses are tied to the machine**. Moving to a new server invalidated the license. What was estimated as 2–3 hours of downtime turned into 2–3 days of waiting for a new license ID from Zoho support.

We apologized to affected users and applied the license as soon as it arrived. The service resumed without further issues, but the delay was entirely my oversight.

### Phase 3: LogixOne Chat Backend (Server D → Server A)

The backend was the hardest. Server D ran PHP 8.2 on Apache, while Server A ran PHP 7.4 — incompatible. We couldn't simply move the files. Instead, I set up a **Docker container** on Server A that mirrored Server D's environment: Apache with PHP 8.2, matching extensions, matching configuration.

The migration happened over a weekend. Files were rsynced into the new container. The container ran Apache serving PHP via PHP-FPM — matching the original server D stack exactly. The service came up behind the existing Nginx reverse proxy on the host, which routed traffic to the container's Apache.

### Phase 4: OS and Web Server Migration

Two weeks after the consolidation stabilized, we migrated the entire platform from CentOS 7 (end-of-life) to Ubuntu 24.04 LTS, and switched from Apache to Nginx as the reverse proxy.

Rather than upsize and downsize the existing server twice, I provisioned a new ECS instance with the same specs and migrated in phases.

**Step 1 — LogixOne Chat backend.** This was the simplest since it was already containerized. I created a Docker Compose setup on the new server and moved the container over. No surprises.

**Step 2 — LogixOne Chat frontend.** The widget had been running PHP 7.4 on the old server. I tested it locally with PHP 8.2 alongside the backend container and confirmed compatibility before migrating. It worked without issues.

**Step 3 — Zoho Analytics On-Premise.** Learning from the previous phase, I contacted Zoho *before* scheduling the migration to request a new license for the new machine. It took 5 days of back-and-forth to get the new license. Once received, the migration itself was straightforward.

Then it broke. Two days after the migration, the license became invalid again. Zoho support cited an IP change — but the IP hadn't changed. The server had two network interfaces (public and private), which is standard. Zoho requested debug info from their internal diagnostic tool, and after another day, issued a new license. The service resumed without further issues.

**Step 4 — Remaining applications (smallest to largest).** This was the bulk of the migration. I moved applications one by one, starting with the smallest and least critical:

- **Light apps** — No issues. Straightforward rsync and configuration porting.
- **Operator app** — A mobile-connected application. Had configuration differences between Apache (old server) and Nginx (new server) that took some debugging, but resolved cleanly.
- **Internal HR application** — The largest and most critical. The migration itself was smooth, but a post-migration issue required separate debugging (covered in a separate investigation).

By the end of this phase, the entire platform was running on Ubuntu 24.04 behind Nginx, with two Docker containers for PHP environments: one for 7.4 and one for 8.2.

## Results

- **4 servers → 1.** All 18 applications now run on a single Ubuntu 24.04 server.
- **~30 Docker containers** (1 for LogixOne Chat backend; the rest for other services).
- **~45–50% reduction** in monthly hosting costs.
- **SSL renewals simplified** — one server to update instead of three.
- **No data loss** during any phase of the migration.

## Challenges

- **Zoho license portability.** Moving an on-premise license to a new machine requires a support ticket. This is documented in their licensing terms but easy to overlook when planning the migration. A 2-hour downtime estimate became 2–3 days because of this. My mistake, and I should have read the licensing fine print before scheduling the migration.
- **Zoho license instability.** Even after obtaining a new license for the Ubuntu migration, it became invalid two days later. Zoho claimed an IP change that didn't exist. Resolving this required another support ticket, debug logs from their diagnostic tool, and a 1-day wait for a replacement license.
- **PHP version incompatibility.** Server A was on PHP 7.4 (Apache). The LogixOne backend needed PHP 8.2. Docker containerization solved this cleanly, but it added an extra setup phase to the plan.
- **Apache to Nginx configuration drift.** The operator app had configuration differences between Apache (old) and Nginx (new) that required post-migration debugging.
- **Resource headroom.** We upsized Server A before the migration, but estimating the final CPU/memory requirements was guesswork until everything was running together.
- **Communication.** The Zoho license delays required apologizing to affected users twice — once for the initial migration, once for the unexpected license invalidation.

## Lessons Learned

- Check license portability *before* scheduling a migration, not after.
- With Zoho On-Premise, expect the unexpected even after you think the license issue is resolved.
- A phased approach (simplest service first) builds confidence and catches process issues before they affect critical systems.
- Containerizing applications before an OS migration makes the OS switch dramatically simpler — the app doesn't care what's underneath.
- "Don't fix what's not broken" is a reasonable starting point, but it should be revisited when costs or operational overhead change the equation.
- When migrating an entire platform, budget buffer time for licensing surprises. They will happen.

## Technologies

- Docker
- Nginx (reverse proxy)
- Apache + PHP 7.4 (Server A original stack)
- Apache + PHP 8.2 (containerized for LogixOne backend)
- Zoho Analytics On-Premise
- Alibaba Cloud (ECS)
- Ubuntu 24.04 / CentOS 7 (legacy)
- rsync

## References

*Internal proposal documents and billing records — not publicly available.*