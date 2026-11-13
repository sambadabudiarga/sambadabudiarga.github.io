---
title: Layered Redis Failure — BullMQ and the ACL That Took Four Fixes
summary: Adding BullMQ to a Node.js application produced one production symptom and four independent causes — a hardcoded localhost, a config with no credential path, two separate Redis initializers, and an ACL user missing one permission. Each fix looked final. None of them was.
date: 2026-11-13
tags:
  - redis
  - bullmq
  - nodejs
  - docker
  - acl
  - configuration
  - deployment
  - debugging
  - layered-failure
  - least-privilege
category: applications
severity: High
status: Resolved
technologies:
  - Redis (ACL)
  - BullMQ
  - Node.js
  - Docker
systems:
  - Internal Node.js application
  - Shared Redis instance
estimated-reading-time: 7
---

# Layered Redis Failure — BullMQ and the ACL That Took Four Fixes

## Context

We were adding background job processing to an existing Node.js application. The queue library was BullMQ, which needs its own Redis connection — separate from whatever the application already did, and configured independently of it.

The developer built and tested it locally, where it worked. The deployment target was production, directly. We no longer run a staging environment; for reasons specific to this application we could not stand one up, so a change that passes on a laptop goes straight into production.

That is the setup. It is not a good setup, but it is the setup that existed, and this incident is largely a bill for it.

The production Redis instance is not permissive. The `default` user is disabled, and any client must authenticate as a named user with its own password. The Redis instance is also shared with other applications.

## Symptoms

The deploy finished and the application returned errors. Not a broken queue, not a stalled worker — the application itself.

One symptom. That is the part worth holding onto: throughout this incident, there was never more than one visible error at a time. The system did not tell us there were four problems. It told us there was one, made us fix it, then told us there was another.

## Evidence

- The application failed on startup after deployment. It worked locally.
- Reading the connection code showed the client was configured with a host, a port, and a database number. Nothing else.
- The host was not configuration at all — it was **hardcoded to `localhost`**.
- There was no field, option, or URL that would have accepted a username or password. The code could not have sent credentials even if we had them.
- No key prefix was set on any cache write.

## Hypotheses

We did not start with a list of hypotheses; we started with the assumption that this was one problem. That assumption cost most of the investigation.

Once the layers began to separate, the working model became: something about the connection is wrong, and we will find out how many somethings as we go.

## Timeline

Approximate. Total elapsed time was around three hours, and precise timestamps were not recorded.

1. **Deploy.** The application errors. Locally it never did.
2. **Code review.** Connection configuration has no credential path at all, and the host is `localhost`. Explained: credentials were missing because there was nowhere to put them.
3. **First fix.** Configuration is widened to include username and password, the host becomes configurable, and a key prefix is added so this application's cache cannot collide with anything else on the shared instance. Reviewed, deployed.
4. **Still failing.** Same shape of error.
5. **Searching the codebase.** Found that Redis is initialized in **two separate places** — two classes, each opening its own connection, each with its own copy of the configuration. Only one had been fixed.
6. **Second fix.** The second initializer is corrected. The application starts. Believed resolved.
7. **A function that uses the queue fails.** Not the startup path — an actual unit of work. So the connection was up, and something else was still wrong.
8. **Verbose errors.** Error output is made more detailed, because the previous message did not identify what was actually being refused. The real problem appears: the ACL user is permitted to connect, but not permitted to run the command BullMQ needs. The user had been created deliberately restricted.
9. **Third fix.** Research which permissions the library actually requires, grant only that, restart. Verified by running the queue-backed function end to end.

## Experiments

**Widening the configuration.** Credentials, host, and prefix added in one pass. This resolved a real defect but did not change the error, which made it look like the wrong fix rather than an incomplete one.

**Searching for every Redis instantiation.** The decisive step, and it was mechanical rather than clever: find every place a connection is constructed, not every place a config is read. Two hits. One fixed.

**Raising log verbosity.** The second breakthrough, and also mechanical. The default error was accurate and useless — it reported that an operation failed without reporting why the server refused it. Once the underlying reply was visible, the permission gap was immediate.

**Functional test, not startup test.** The third failure was only discovered because a queue-backed function was exercised after the app came up. Startup success and working queue are two different claims.

## Dead Ends

- **Treating the first fix as sufficient.** The configuration change was correct and did not work, which invited the conclusion that configuration wasn't the problem. It was; the fix was just incomplete.
- **Assuming one initializer.** The application started, so the connection layer seemed settled. It wasn't — one path was still on the old hardcoded config and only revealed itself when a code path that used it was exercised.
- **Reading the error message at face value.** A generic failure reads like a connection failure. It was a permission failure over an already-working connection. Two different layers, indistinguishable from the outside.

## Technical Findings

The failure was four independent defects, stacked, each hidden behind the one above it:

1. **`localhost` inside a container is the container.** Redis runs in its own container, so a hardcoded `localhost` could never have reached it — regardless of credentials. This was never a misconfiguration in the usual sense; the code was written for a process that shared a network namespace with Redis, and it did not.
2. **The configuration schema had no notion of authentication.** No username, no password, no connection URL. Combined with (1), the code was incapable of expressing a correct production connection.
3. **Two Redis initializers.** The application constructs connections in two places. Fixing one is a partial deploy of a single logical change — the worst kind, because it produces a system that is half-correct and reports success.
4. **ACL permissions were narrower than the library needed.** A named user with a password was created, and the `default` user was disabled, but the user's command permissions did not include what BullMQ reads on connect. The denial came back over a healthy connection, which is why it did not look like an access problem.

A fifth defect was found in the same pass and was not fatal: **no key prefix**. On a shared Redis instance, an application without a prefix will happily read and write keys it did not create. This did not cause the outage. It would have caused a much stranger one later.

## Root Cause

Four independent defects, each surfaced only after the previous was fixed. The connecting theme is not Redis — it is that **a single visible symptom implied a single cause**, and every fix was verified against the same narrow signal (does the error go away) rather than against the actual requirement (does the queue work).

## Resolution

Configuration widened to accept host, credentials, and key prefix; both initializers corrected; the ACL user granted the specific command permission the library requires, and nothing more.

## Verification

The application started, and then — the part that mattered — a function that enqueues real work was run end to end and completed. Startup alone had already lied to us once.

## Prevention

- **Configuration must be able to express the production environment.** If the config schema has no field for authentication, the application cannot run against an authenticated server. That is a design defect, not a deployment mistake.
- **Count initializers, not config files.** When a shared resource is configured in more than one place, the change is not done until every construction site is changed. Grep for the client constructor, not for the settings object.
- **Grant permissions deliberately, and document the list.** Least privilege is correct, but it has to be specified against what the library actually calls — not discovered by production failure.
- **Key prefix from day one.** Any client on a shared instance should be namespaced before its first write, not after the collision.
- **Verify with the feature, not the startup.** "It runs" and "it works" are different claims and should be tested separately.
- **Local success against a permissive server proves nothing about production.** A local Redis with no password is not a smaller version of a production Redis; it is a different thing. This is exactly the class of gap a staging environment exists to catch, and we do not have one.

## Lessons Learned

- One error message does not mean one bug. Fixing a real defect and finding the error unchanged is not evidence that the defect was irrelevant — only that the stack is deeper than the message.
- The two most useful actions in this incident were the least clever: enumerating every place a connection is constructed, and making the error louder.
- Getting a better error message is a debugging technique, not a logging chore. Most of the three hours went to errors that were honest and uninformative.
- Testing on a laptop that has no ACL is not a test of an ACL-configured deploy. The thing being added was the thing the local environment didn't have.
- Doing this without staging meant every one of these four mistakes was discovered by us, in production, in sequence. Three hours of sequential discovery is a *good* outcome for that constraint — which is the strongest argument for the constraint being wrong.
- "Or so it seems" is a phrase worth keeping in your vocabulary during an incident. Twice, the system came up and the problem was still there.

## What this record is missing

The exact Redis error replies were not preserved — not the authentication failure, not the permission denial. This is the one thing I would change about the record: the first error was generic enough to send us looking at the wrong layer, and the exact text would have shown that immediately. Preserve raw error output during an incident, before the message gets paraphrased in conversation.

The two classes that each opened a connection are described generically here for reasons of internal policy. The structural lesson does not depend on their names.

## Technologies

- Redis (ACL users)
- BullMQ
- Node.js
- Docker

## References

*Internal. No public references available.*
