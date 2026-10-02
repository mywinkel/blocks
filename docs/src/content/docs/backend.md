---
title: Backend handlers and permissions
description: Understand backend authentication, tenant SQL access and trust boundaries.
---

Add a backend handler only when the feature needs server-side work. The handler
receives a `Request` and SDK `PackageContext`. Use the host-provided
`tenantId`, `packageName`, `actor`, and `database` capability; do not accept a
tenant or package identity from request data.

The [notes example](https://github.com/mywinkel/blocks/tree/main/examples/notes)
shows a complete handler. It demonstrates SQL parameter values and the
package-specific table namespace.

## Choose the access level

`backendAccess` in the package manifest controls who can invoke the handler:

| Value | Request behavior |
| --- | --- |
| `public` | Skips session authentication; the handler receives no actor. |
| `authenticated` | Requires an authenticated tenant member. |
| `owner` | Requires an authenticated member whose role is `owner`. |

For authenticated handlers, unsafe methods such as `POST`, `PUT`, `PATCH` and
`DELETE` must include an `Origin` matching the request origin. Apply your own
input validation and authorization inside the handler as well. Authentication
proves who is calling; it does not make arbitrary requested actions safe.

## SQL capability and its limits

`host.database.sql()` accepts batches of SQL statements with parameter values.
The host binds a tenant and package identity to this capability; handler code
cannot choose another tenant or package namespace. Ordinary SQL can read, insert,
update and delete rows in tenant tables, subject to the gateway's SQL checks and
protected host/control tables.

This row grant is broader than schema ownership. **An installed backend package
can access tenant rows outside its own tables.** It may also bypass CMS workflows
and business rules that are enforced by host APIs, because direct SQL does not
run those APIs. Treat backend package code as trusted with tenant data; use
placeholders for values, validate every request and keep workflow invariants in
host-provided operations where available.

Schema changes are narrower: migrations can change only the package's own
namespaced tables and indexes. Direct handler SQL cannot perform DDL. The
SQL gateway parses and regenerates supported SQLite statements and rejects
unsupported syntax; triggers, views, virtual tables, `ATTACH` and `PRAGMA` are
outside the contract.

Backend handlers and server rendering run in isolated Workers without outbound
network access. This isolation limits access to host/platform resources; it does
not narrow the tenant-row grant described above. Storefront browser code runs in
the page and has the page's browser privileges, so keep secrets and privileged
operations on the backend.
