---
title: HTTP/2 Upload Failure — Post-Migration, Angular/Ionic App
summary: After migrating to a new server with Nginx HTTP/2, file uploads in an Angular/Ionic mobile app silently failed while all other requests worked. The root cause was a compatibility gap between the legacy HTTP client and HTTP/2.
date: 2026-08-05
tags:
  - http2
  - nginx
  - apache
  - ionic
  - angular
  - upload
  - migration
  - cross-stack
category: applications
severity: High
status: Resolved
technologies:
  - Nginx
  - HTTP/2
  - HTTP/1.1
  - Apache
  - Angular
  - Ionic 3
  - Docker
systems:
  - Internal HR application
  - Mobile app (employee shift management)
estimated-reading-time: 6
---

# HTTP/2 Upload Failure — Post-Migration, Angular/Ionic App

## Context

After migrating the internal HR application from Apache on CentOS 7 to Nginx on Ubuntu 24.04, everything appeared to work. Login worked. Navigation worked. Standard POST requests worked. Testing was manual — we don't have automated tests — and nothing looked wrong during the initial check.

The application is an Angular/Ionic mobile app. It has been in maintenance mode for a while and is no longer actively developed.

## Symptoms

A customer reported they couldn't start their shift. The app showed a loading spinner that never resolved. This happened a few hours after the migration completed, on a weekend when some employees were working.

The shift-start action involves uploading an image (multipart form-data, enctype). All other request types — GET requests, text-only POST requests — worked fine in the same application.

## Evidence

- **Nginx access logs** showed **no incoming request** for the shift-start endpoint, even though the app showed a loading state. The request was being sent by the client but never reached the server.
- Other requests from the same app on the same device reached the server without issue.
- The app worked correctly on the old server (Apache, HTTP/1.1).
- Comparing response headers between the old and new server revealed the protocol difference: Apache was serving HTTP/1.1, Nginx was serving HTTP/2.

## Hypotheses

1. **Nginx upload configuration.** Client body size, proxy buffering, or timeout misconfiguration. Discounted because other apps on the same Nginx handled file uploads without issues.
2. **Angular/Ionic HTTP client bug.** A gap in how the legacy HTTP client handled multipart uploads over HTTP/2.
3. **Network-level issue** — something between the mobile app and the server interfering with multipart content over HTTP/2.

## Timeline

- **H-0: Migration completed.** HR app moved to new server (Ubuntu 24.04, Nginx). Manual smoke test passed.
- **H+2: Customer reports shift-start failure.** Loading spinner stuck on file upload. Switched HR app back to old server — customer could work again within minutes.
- **H+3: Debugging begins.** Set up test environment on new server. Confirmed multipart uploads fail silently while all other request types succeed.
- **H+3, key insight:** Compared response headers. Old server: HTTP/1.1. New server: HTTP/2. External research confirms known gap between legacy Angular/Ionic HTTP clients and HTTP/2 multipart handling.
- **H+4: Fix confirmed.** Disabled HTTP/2 on Nginx test config. Upload succeeded.
- **H+5: Re-migration completed.** HR app moved back to new server with HTTP/2 disabled. Verified with live test.
- **H+12h: Customer follow-up.** Shift-start working. No further issues.

## Experiments

**Experiment 1 — Compare request behavior by type.**
Tried GET, text-only POST, and multipart POST from the same app against the new server.
- GET: ✅ Worked
- Text-only POST: ✅ Worked
- Multipart POST (file upload): ❌ Failed — request never logged by Nginx

**Experiment 2 — Nginx configuration comparison.**
Compared the HR app's Nginx virtual host against other apps. All used the same base config.
- Upload limits: ✅ Identical
- Proxy buffers: ✅ Identical
- Timeouts: ✅ Identical

**Experiment 3 — Protocol comparison.**
Compared response headers between old and new server:
- Old server: `HTTP/1.1`
- New server: `HTTP/2`
Disabled HTTP/2 as a test. Upload succeeded.

## Dead Ends

- **Nginx upload size limit.** Ruled out when we confirmed the same Nginx handled other apps' uploads without issues.
- **Application code bug.** Reviewing the Angular/Ionic upload code showed no obvious issues. The same code worked under HTTP/1.1.
- **Missing PHP configuration.** Verified `upload_max_filesize` and `post_max_size` were correct.

## Technical Findings

The root cause is a **compatibility gap between the Ionic/Angular HTTP client and Nginx HTTP/2** for multipart upload requests. The legacy client sends the request in a way that Nginx's HTTP/2 module does not process correctly, causing the request to be silently dropped before it reaches the access log.

The exact mechanism appears to be related to how the HTTP/2 framing layer handles multipart boundaries — a known edge case with older HTTP clients that were designed and tested primarily against HTTP/1.1.

## Root Cause

Legacy Angular/Ionic HTTP client incompatibility with Nginx HTTP/2 for multipart form-data (file upload) requests.

## Resolution

Disabled HTTP/2 for the HR application's virtual host in Nginx. The application reverted to HTTP/1.1, and uploads worked immediately.

## Verification

- Test environment: Upload succeeded with HTTP/2 disabled.
- Live environment: Customer confirmed shift-start working the next morning.
- No further issues reported.

## Prevention

- When migrating legacy mobile applications to a new web server, always test file uploads specifically — they exercise a different code path than regular requests.
- Compare HTTP protocol versions between old and new infrastructure as part of the smoke test checklist.
- For applications in maintenance mode with no active development, prefer protocol stability (HTTP/1.1) over newer protocols that the client may not handle correctly.

## Lessons Learned

- A passing smoke test (login + navigation) is not sufficient after a web server migration. File uploads, large payloads, and multipart requests must be tested separately.
- Protocol differences between Apache and Nginx are not limited to configuration syntax — HTTP/2 vs HTTP/1.1 is a behavioral difference that can break legacy clients.
- When a request disappears without a trace in Nginx access logs, suspect an HTTP protocol-level issue, not an application bug.
- The old server should be kept available during the stabilization window (we left it running for a week — that instinct saved us a weekend of emergency effort).

## Technologies

- Nginx (HTTP/2)
- Apache (HTTP/1.1)
- Angular / Ionic 3
- PHP (Laravel backend)
- Docker

## References

*Internal. No public references available.*

*There is prior art online documenting similar issues between Angular/Ionic HTTP clients and HTTP/2 for multipart requests — though I found the article after already reaching the same conclusion.*