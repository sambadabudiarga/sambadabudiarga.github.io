# Data

Incidents involving data integrity, replication, and storage.

- [Zombie Rows — A Corrupt Table That Accepted Every Write](/notebook/incidents/data/zombie-rows-corrupt-table-silent-writes) — A store rebuilt after a lightning strike ran for days without persisting a single write. `UPDATE` and `DELETE` reported rows affected, nothing changed, and the deleted rows kept appearing in `SELECT`.