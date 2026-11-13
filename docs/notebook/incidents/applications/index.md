# Applications

Incidents involving application-layer issues.

- [HTTP/2 Upload Failure — Post-Migration, Angular/Ionic App](/notebook/incidents/applications/http2-upload-failure-ionic) — Legacy HTTP client fails silently on multipart uploads over HTTP/2. Disabling HTTP/2 resolves.
- [Layered Redis Failure — BullMQ and the ACL That Took Four Fixes](/notebook/incidents/applications/layered-redis-failure-bullmq-acl) — One visible error, four independent causes: hardcoded `localhost`, no credential path, two Redis initializers, and an ACL user one permission short.
- [Bad Merge Resolution — The Conflict Was Fixed, the Code Was Not](/notebook/incidents/applications/bad-merge-resolution-lost-work) — A large conflict resolved alone on a feature branch quietly reverted two colleagues' work. Nothing unusual in the history, because the resolution commit was perfectly valid.