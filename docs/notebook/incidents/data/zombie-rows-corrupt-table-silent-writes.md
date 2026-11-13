---
title: Zombie Rows — A Corrupt Table That Accepted Every Write
summary: A store's server was rebuilt after a lightning strike, using the drive that appeared to have survived. The application worked, transactions were entered, and nothing was written. UPDATE and DELETE both reported rows affected and changed nothing, and SELECT kept returning rows that had been deleted minutes earlier.
date: 2026-01-15
tags:
  - sql-server
  - corruption
  - data-integrity
  - dbcc
  - retail
  - replication
  - hardware
  - troubleshooting
category: data
severity: High
status: Resolved
technologies:
  - SQL Server
  - DBCC CHECKDB
  - SELECT INTO
  - T-SQL
systems:
  - Retail POS database (store)
  - Head office database
  - Store-to-head-office replication
estimated-reading-time: 8
---

# Zombie Rows — A Corrupt Table That Accepted Every Write

## Context

This is a retail deployment where every store runs the point-of-sale application on its own SQL Server database, with head office holding the master data and replication moving stock and transactions upward.

One afternoon, the customer's IT team asked for help with a store that had been hit by lightning. The hardware had taken damage, but the application drive had survived — or so it seemed.

The machine had two drives: one for the operating system, one for the application and its database. The system drive was rebuilt. The application was reinstalled against the surviving data drive, and the store was brought back up.

It worked. Transactions were entered at the store, sales went through, and the store traded normally for several days. From the outside, the recovery was complete.

## Symptoms

On day three or four, head office reported that the reinstalled store's stock data was not updating.

The figures were wrong in both directions: the store had stock figures that didn't match its own transaction history, and head office had stock figures for that store that never changed. Separately, several items were showing incorrect pricing at the store.

None of it looked like a usual failure. There were no errors, no crash, no failed login, and no unusual transactions at the store — normal goods receiving and normal sales.

## Evidence

- **Master data was correct** at both head office and the store. The item records themselves were intact.
- **Five problem items** were supplied by head office as samples. Selecting them by primary key returned rows, with quantities present.
- **The history did not reconcile.** For each item, the row existed and the quantity existed, but the movement history didn't support the quantity. That looked, initially, like a stock calculation that had stopped running.
- **The obvious explanation ruled itself out:** if the stock calculation were broken, every store would be reporting the same symptom, and this store's transactions were entirely ordinary.
- **I still had the data as it was immediately after the reinstall.** Comparing the current table against that copy, they were **identical**. The store had been trading for days and not a single write had landed.

That comparison is where the shape of the problem changed. Nothing was miscalculating. Nothing was being written at all.

## Hypotheses

1. **The stock calculation in the application is broken.** Rejected early — other stores would show the same symptom, and this store's transactions were entirely unremarkable.
2. **Replication is not running for this store.** Plausible at first: the store's figures froze while head office's didn't. Then the pricing errors appeared, and pricing flows *down* from head office. Two directions failing at once is not a replication problem, it's a store problem.
3. **The database on the surviving drive cannot be trusted.** This was the least appealing hypothesis and the correct one.

## Timeline

The sequence within the evening is accurate; the calendar dates are not recorded.

- **Afternoon.** Request from customer IT: a store was hit by lightning. The application drive survived.
- **Same day.** System drive rebuilt, application reinstalled over the surviving data, store brought up and tested. Transactions worked.
- **Day 3–4.** Head office reports stock not updating, plus wrong pricing on several items at the store.
- **Same day, evening.** Master data verified as correct on both sides. Five sample items selected by primary key. Compared against the setup-time copy of the data: identical.
- **Same night.** A manual `UPDATE` on one item. The server reported **1 row affected**. Selecting the value again: unchanged. Repeated five times, because the first explanation was that I had misread it.
- **Then a `DELETE`.** Also **1 row affected**. Selecting the item again: still there.
- **Same night.** `DBCC` checks reported corruption. Repairs were attempted in escalating steps; the same test kept producing the same result.
- **Then the table was recreated** from its data. Writes worked.

## Experiments

**Manual write test.** Update a single row, note the original value, update it, select it back.

| Attempt | Server said | Actual result |
|---|---|---|
| `UPDATE` ×5 | 1 row affected | value unchanged |
| `DELETE` | 1 row affected | row still returned by `SELECT` |

**Consistency check.** `DBCC` reported corruption in the table. This converted a very strange behaviour into a known category of problem.

**Repair attempts.** Repairs were attempted in escalating steps — a straightforward repair, then a rebuild of the table's indexes, and finally the most aggressive repair option the tool offers. After each one the write test was repeated, and after each one the behaviour was identical: the statements reported success, the data did not change.

**Recreate and retest.** New table, data loaded, then insert, update, delete and select. All behaved correctly.

## Dead Ends

- **"The application is miscalculating stock."** Ruled out by the absence of the same complaint at other stores, and by the store's ordinary transactions.
- **"Replication is down."** Ruled out when pricing — which flows in the opposite direction — also failed.
- **"I'm misreading the result."** It was late, and the first four repetitions of the update test were spent assuming exactly that. The fifth was spent accepting it.
- **"Repair will fix it."** It didn't. Corruption that can be repaired is a subset; this wasn't in it.

## Technical Findings

**A DML statement's row count is not a durability guarantee.** "1 row affected" reports what the statement processed. When the page underneath is inconsistent, the statement can succeed from the caller's point of view while the modification never lands. There is no error, no warning, and no row count discrepancy — just a write that didn't happen.

**`SELECT` and `UPDATE` disagree about reality.** Because the row was still readable, the data looked present. Because the delete reported success and the row remained visible, it looked like the row had come back. Nothing was coming back; nothing had ever left.

**This is why the symptom was "stock stopped updating" and not "the database is broken".** The store kept accepting transactions, which is exactly what a working system does — the writes simply didn't persist, so there was nothing new to replicate upward, and inbound price updates didn't apply either.

**These were not ghost records, and that distinction matters.** A ghost record is a normal SQL Server mechanism: a deleted row is marked as deleted and left in place until background cleanup processes it. Ghost records are not visible to `SELECT`, they are not corruption, and they resolve themselves. What was in this table was page-level corruption — rows that were never actually modified, behind statements that reported success. Anyone arriving here looking for "deleted rows still visible in SQL Server" should know that these are two different problems, and only one of them is benign.

**The reinstall restored the application, not the data.** Bringing the application back up on the surviving drive reattached a database that had already been damaged. The recovery looked complete because the application could read.

## Root Cause

Page-level corruption in the store's application database, present on the drive that survived the lightning strike.

The mechanism of the damage is **not established**, and this record does not claim one. A power event, undetected surface damage on the drive, or something that happened during the rebuild are all consistent with what was observed. What is established is that the corruption arrived with the data, and that nothing in the recovery process checked for it before the store went back into service.

## Resolution

The table was recreated and its data reloaded. Writes then behaved normally, stock began moving again, and replication resumed.

## Verification

- Insert, update, delete, and select on the recreated table: all behaved correctly, repeatably.
- Stock figures at the store began to change with transactions, and head office received them.
- Pricing updates from head office applied.

## Prevention

- **A drive that survives a power event is not a verified drive.** Any database restored from failed hardware should get a consistency check before it goes back into service — before the store trades on it, not after a complaint arrives four days later.
- **Test writes, not reads.** The recovery test was "can we make a sale?" — which exercises reads, reads, and an insert. It never tested whether an update to an existing row persisted. That is a one-minute test and it would have found this on day one.
- **When a statement reports success and the data disagrees, stop trusting the statement.** The instinct to assume you misread the result is the correct first instinct exactly once. After that it's evidence.
- **Recreating a table from a `SELECT` copies data, not schema.** Primary keys, indexes, defaults and constraints do not come along. This was forgotten during the recovery, and it caused a later problem that needed its own investigation.

## Lessons Learned

- **"1 row affected" means the engine processed a row.** It does not mean the row was written. When the page is corrupt, the two statements are true and false at the same time, and only the data can tell you which.
- **A recovery is not finished when the application starts.** The application starting only proves the application can read the database. Writes are a different code path, and in this incident they were the only path that mattered.
- **Corruption doesn't behave consistently.** Reads worked, inserts worked, updates and deletes silently didn't. Any assumption that "the database is either working or broken" is wrong, and it costs hours when it's wrong.
- **Check the boring thing first — but verify it, don't assume it.** Two of the four drives were fine and the data looked fine. "The disk survived" was a statement about a disk, and I treated it as a statement about the data.
- **Late at night, distrust the data before distrusting yourself — once.** Repeating the same test five times did eventually produce the right conclusion, but four of those five repetitions were spent re-checking my own eyes instead of the system's claim.
- **A quick fix that loses schema details becomes the next incident.** Creating a table from a `SELECT` is the shortest path back to a working table and the longest path to a stable one.

## What this record is missing

- The exact `DBCC` error numbers and which repair options were attempted. The sequence is remembered — a straightforward repair, an index rebuild, and the most aggressive option — but not the specific commands or the messages they returned.
- Which tables were affected. This is withheld deliberately rather than forgotten: the affected tables are part of a commercial system and naming them would identify the deployment.
- The calendar dates of the strike and the recovery.
- Why the pricing rows failed independently of the stock rows — whether both were corrupt or one was a consequence of the other was never separated.
- What broke later as a result of the recreated table. It was a small problem rather than an incident, and it isn't recorded here; this record stops at the point where the zombie rows were laid to rest.

## Technologies

- SQL Server
- `DBCC CHECKDB` and repair
- `SELECT INTO` (table recreation)
- T-SQL (`UPDATE`, `DELETE`, `SELECT`)
- Retail POS application (VB6) and store replication

## References

*Internal. The customer, the store and the application are not named. No public references available.*
