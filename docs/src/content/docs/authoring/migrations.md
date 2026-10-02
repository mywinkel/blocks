---
title: Package migrations
description: Add package-owned schema changes with immutable, checksummed migrations.
---

Use migrations when a backend package needs persistent data. They are declared
in order in `block-package.json`; the
[notes example](https://github.com/mywinkel/blocks/tree/main/examples/notes)
includes a complete `0001_notes` migration.

## Rules

- Give each migration a unique, ordered id such as `0001_notes` or
  `0002_add_status`.
- Include the SHA-256 checksum of the exact SQL text in the manifest.
- Keep each applied id, checksum and SQL immutable in later package versions.
- Create and alter only namespaced tables and indexes owned by this package.
- Compatible migrations preserve the behavior and data expected by the active
  package version.
- Mark a destructive change as `maintenance`; it needs a separate owner-approved
  operation and a recovery bookmark. It is not part of a normal package update.

Migration SQL runs atomically with the host-managed migration journal. The
journal is not available to package SQL. The gateway fails closed on unsupported
SQLite syntax; triggers, views, virtual tables, `ATTACH` and `PRAGMA` are not
supported.

## Data and rollback

The normal `compatible` path may create package-owned tables and indexes or add
columns. Dropping owned objects and other destructive changes require the
maintenance path. Removing package code does not automatically erase package
data, and reverting code does not rewind tenant data. Plan a recovery procedure
before changing stored data or its schema.

Direct SQL row access is still broader than migration ownership. See
[backend permissions](/blocks/backend/) for the full tenant-data boundary.
