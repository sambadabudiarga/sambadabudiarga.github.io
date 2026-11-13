---
title: DIY Replication — SQL Server 2005 Back Into 2000
summary: A retail deployment running VB6 on SQL Server 2000 could no longer be installed on Windows 10 and 11. Moving the stores to SQL Server 2005 fixed that — but native replication only worked in one direction, so the other direction became a queue table, three PHP scripts, and a folder of JSON files. It still runs.
date: 2024-03-15
tags:
  - sql-server
  - replication
  - legacy
  - php
  - vb6
  - windows
  - migration
  - integration
  - triggers
  - diy
category: case-study
technologies:
  - SQL Server 2000
  - SQL Server 2005
  - SQL Server native replication
  - T-SQL triggers
  - PHP
  - VB6
  - Windows Task Scheduler
  - JSON
systems:
  - Retail POS application (VB6, one instance per store)
  - Store databases (SQL Server 2005)
  - Head office database (SQL Server 2000)
estimated-reading-time: 9
---

# DIY Replication — SQL Server 2005 Back Into 2000

## Background

One of our retail customers runs a point-of-sale system built in VB6 on top of SQL Server 2000. The application was installed per store, each store with its own database, and head office held the master data. Replication between head office and the stores was SQL Server 2000's native replication, configured by script — it was set up once, it worked, and nobody had to think about it for years.

That arrangement survived multiple generations of hardware. What it did not survive was the operating system.

As Windows 10, and then Windows 11, replaced older Windows versions on store machines, the SQL Server 2000 installer stopped behaving. Some machines installed it and then ran unreliably. Some refused outright. Stores began complaining, and the complaints were not about the application — the application was fine — but about the fact that the thing underneath it could no longer be put on a modern PC.

That is the constraint this project started from. The application could not be replaced: it is a system the customer purchased and has been running for years, and replacing it is a budget decision on their side, not a technical one on ours. VB6 and SQL Server 2000 were not a preference; they were the thing that had to keep working.

## Objectives

- Get the stores onto an operating system that still receives support, without changing the application.
- Keep replication working in both directions: master data from head office down to stores, transactions and stock from stores back up to head office.
- Do it without a store-by-store rebuild, and without asking stores to change how they work.

## Approach

### Step 1 — Stop at 2005, deliberately

The obvious move was to jump to something current. I deliberately did not. The application talks to the database through an old driver and expects old behaviour, and the further I moved the engine from what the application was written against, the more likely I was to trade an installer problem for an application problem. SQL Server 2005 was the smallest step that still installed on modern Windows.

This was a judgement about risk, not about technology. It is also the decision most worth revisiting in hindsight, because it's the one that created the second problem.

### Step 2 — Prove it on one machine before touching a store

I asked the customer's IT team for a single PC to test on, and I took a copy of a real store database — the `.mdf` and `.ldf` files straight from a live store — plus a dummy copy of the application.

I installed SQL Server 2005 on that machine and attached the database copy. The format conversion from 2000 to 2005 took a while, and then it succeeded.

That's where the first assumption went in.

### Step 3 — Reinstall, because of an instance name

The application refused to connect. SQL Server 2005 installs as a **named instance** by default, and this application does not support named instances — it expects to find the server at the default instance and nowhere else.

So the whole install was redone as a default instance, and the database was attached again. The application then ran.

It ran, and it felt slow when navigating the menus. I put that down to the modest PC the customer had given me for testing — a test machine is a test machine — and moved on.

### Step 4 — The discovery that shaped the project

Once the store side was working, I went to set up replication between the new 2005 stores and the 2000 head office.

Head office to store — 2000 publishing to a 2005 subscriber — worked. The newer version could consume what the older one published.

The other direction did not. With what we were deploying, pushing data from 2005 back into a 2000 database was not available to us. One direction of a two-direction design was simply gone, and the entire retail deployment depends on that direction: transactions and stock have to reach head office.

### Step 5 — Build the missing direction

I built it in PHP, for a reason that is honest rather than elegant: PHP is the language I'm strongest in. Given a problem with a deadline and no vendor path, the right tool was the one I could build and maintain alone.

The design is a queue, a transport, and an apply step.

**On the store side (2005):**

I listed the tables the old native replication had covered, and on each of them I installed triggers for `INSERT`, `UPDATE` and `DELETE`. Each trigger writes the table name and the row's primary key into a **queue table**. The primary key field name is hardcoded per table, because the tables were already built with that in mind — one of the few things that went in our favour.

That is all the database does. It records *which rows changed*, not what the change was.

**Transport:**

A PHP worker, run by the Windows scheduler on the store machine, reads the queue in batches and sends it to head office as JSON over HTTP.

**On the head office side:**

A PHP endpoint receives the payload and writes each entry out as a JSON file. A third PHP process reads those files and applies them into the SQL Server 2000 database.

Three scripts, three hops: queue → HTTP → file → database.

The file stage is not decoration. It separates *receiving* from *applying*, so the store's POST returns as soon as head office has accepted the payload. If head office is slow, or temporarily unable to write, the store does not wait, and the pending work is sitting in a folder where a person can look at it.

**Timing:**

The pipeline runs gently, and the resulting delay is 15–20 minutes. That was a deliberate choice rather than a limit: the goal was never real-time, it was to not add load to machines that are already running a point-of-sale system during trading hours.

## Timeline

Exact dates were not recorded; the phases are what matter.

1. **Windows 10 rollout.** SQL Server 2000 installs become unreliable. Stores start reporting problems.
2. **Decision.** Move the store databases to SQL Server 2005 — no further.
3. **Test machine.** Real store database copy, dummy application, install, attach, format conversion.
4. **Named instance discovered.** Reinstall as default instance, re-attach, application runs.
5. **Replication attempted.** One direction works, the other cannot be done with what we were deploying.
6. **DIY pipeline built.** Triggers, queue table, worker, endpoint, file stage, apply process.
7. **Running since.** Master data down by native replication, transactions and stock up by the PHP pipeline.

## Challenges

- **The installer was the original problem, and it stayed a problem.** SQL Server 2000 on Windows 10 and 11 was unreliable enough that the risk was not "it fails", it was "it works and then misbehaves later, in a store". That uncertainty is what made the migration necessary rather than optional.
- **Format conversion took real time.** Attaching a 2000 database to a 2005 instance is not instant on store-sized data. It worked, but the first attach was long enough to be a planning input, not a coffee break.
- **A named instance broke the application, not the database.** The application's assumption about where a server lives decided the install configuration. Nothing in the error pointed at "use the default instance" — that came from knowing the application.
- **Slowness that may or may not have been the machine.** Menu navigation felt slow on the test machine, and I assumed an underpowered PC. It may well have been. It was never separated from the hardware variable, so it remains an assumption rather than a finding.
- **One-directional replication.** Native replication covered head office → store and not store → head office. There was no configuration to fix this; the direction had to be built.
- **The workaround is bespoke, and bespoke means owned.** It depends on one person's understanding of three scripts and a set of triggers. That is the real cost of this design, and it is higher than the latency.
- **Monitoring is outside the scope.** There is a bot that watches the pipeline, but monitoring was not part of the agreed contract, so notifications arrive without any obligation to act on them. In practice the response is reactive — we find out because someone noticed, or because the bot told us, but not because there's a process that responds to it.

## Results

- **Stores run SQL Server 2005** on Windows 10 and 11, and the VB6 application is unchanged.
- **Master data** flows head office → store using SQL Server 2000's native replication, as before.
- **Transactions and stock** flow store → head office through the PHP pipeline, with a 15–20 minute delay.
- **No application change was required** at any point in the migration. The stores work the way they worked before.
- **The pipeline is still running**, years later, on the same design.

## Lessons Learned

- **Test both directions before believing a replication plan.** One direction working tells you almost nothing about the other; they are different code paths, different permissions, and sometimes different products. The half that worked made the half that didn't feel like an anomaly rather than a missing feature.
- **"It worked" and "it works" are different claims.** The database attached. The application ran. Each of those looked like completion, and each one hid the next problem. An old application on a new engine has to be exercised, not just started.
- **The application's assumptions constrain the database more than the database constrains itself.** Default versus named instance was not a SQL Server question. It was a question about what the VB6 application expects, and only someone who knew the application could answer it.
- **Choosing the language you're fluent in is a legitimate engineering decision — with a named cost.** PHP was the reason this shipped. It is also the reason the pipeline is maintainable by exactly one person. Both of those are true, and the second one is the bill.
- **A workaround that works becomes infrastructure.** This started as a bridge for one direction of one migration. It is now the mechanism the business depends on to know what sold today. Anything that becomes infrastructure eventually needs the things infrastructure needs: monitoring with an owner, documentation, and a replacement plan.
- **Notifications are not monitoring.** A bot that reports a failure, where nobody is obliged to respond, converts an outage into a message. Monitoring is a person and a process attached to the alert.
- **Upgrade decisions are budget decisions.** This system represents a recent, substantial investment by the customer, and a replacement had already been attempted once and rolled back. "Why is this still on SQL Server 2000" has a real answer, and it isn't inertia — it's that someone already paid for it, and the last attempt to move failed.
- **Stopping at the smallest viable version step was right, and it created the real problem.** 2005 got the system onto a supported OS. It also created a version gap that no native replication direction could cross. Both are consequences of the same decision, and I'd take it again — but I'd test replication on day one of the trial, not after the application was declared working.

## What is not settled here

A few things this record does not claim, because they were assumptions at the time or were never verified:

- Whether the menu slowness was the test machine's specification. It was never isolated from the hardware variable.
- How the apply step handles a payload that arrives twice. A queue of primary keys with a separate transport implies the apply side has to tolerate re-delivery; the queue's behaviour under replay isn't documented in this record.
- The exact timeline. The phases are accurate; the dates are not recorded.

## Technologies

- SQL Server 2000 (head office)
- SQL Server 2005 (stores)
- SQL Server native replication (one direction)
- T-SQL triggers (`INSERT` / `UPDATE` / `DELETE`)
- PHP (worker, receiving endpoint, apply process)
- VB6 (the application, unchanged)
- Windows Task Scheduler
- JSON over HTTP

## References

*Internal. The customer and the application are not named. No public references available.*
