# VulnApp — Deliberately Vulnerable Notes App

A small, intentionally vulnerable notes application for security research /
training use (in the spirit of DVWA, Juice Shop, WebGoat). **Do not deploy
this anywhere internet-facing or reuse any of this code in a real product.**

## Stack

- **frontend/** — Next.js (port 3000)
- **backend/** — Express REST API (port 4000)
- **db** — Postgres 15, seeded by `backend/init.sql`

Frontend and backend run in separate containers, talking over the Docker
network and the host-exposed port (`NEXT_PUBLIC_API_URL`).

## Running it

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health check: http://localhost:4000/health
- Postgres: localhost:5432 (user `vulnapp` / pass `vulnapp_pw` / db `vulnapp`)

Seed accounts (all password `password123`):

| Email | Role |
|---|---|
| admin@vulnapp.local | admin |
| alice@vulnapp.local | user |
| bob@vulnapp.local | user |

## Intentional vulnerabilities

### 1. SQL Injection — `GET /api/notes/search?q=`
`backend/src/routes/notes.js`. The search term and `req.user.id` are
concatenated directly into the SQL string instead of using parameterized
placeholders. Classic UNION-based or boolean-blind injection via `q`.

Try: `?q=' OR '1'='1` or a UNION injection to pull data from other tables.

### 2. Stored XSS — note content
`frontend/pages/notes/[id].js`. Note content is saved verbatim and rendered
with `dangerouslySetInnerHTML`, with no server-side or client-side
sanitization. Save a note containing `<img src=x onerror=alert(document.cookie)>`
and view it (or have another user view a public note) to trigger it.

### 3. IDOR — `GET /api/notes/:id/attachments/:attachmentId` (non-basic)
`backend/src/routes/notes.js`. This is **not** a simple "increment the ID in
the URL" bug on the primary resource. The endpoint correctly verifies that
`:id` (the note) belongs to the requester — but then looks up
`:attachmentId` by its own primary key without checking that the attachment
actually belongs to that note. Any authenticated user can create (or reuse)
one note they own, then pair its `id` with an arbitrary `attachmentId` to
read attachments belonging to other users' notes. This is a confused-deputy
/ broken object-level authorization bug on a *nested* resource, not a
sequential-ID guess on the resource itself.

Try: log in as Alice, create any note (note it's id, e.g. 3), then call
`GET /api/notes/3/attachments/2` to read Bob's attachment.

### 4. RCE via Server-Side Template Injection — `POST /api/notes/:id/report`
`backend/src/routes/notes.js`. The note's `content` field is compiled
directly as a Handlebars template (`Handlebars.compile(note.content, {
noEscape: true })`) with user-controlled input and no sandboxing. Handlebars
templates that reach into JavaScript's prototype/constructor chain can be
used to execute arbitrary code in the Node process. Save a note whose
content is an SSTI payload, then hit "Generate report" on that note.

### Bonus (weak-but-not-listed) issues
- Passwords are hashed with MD5 and no salt (`backend/src/routes/auth.js`),
  included for realism since it commonly shows up alongside these other bugs.
- The admin role is trusted straight from the JWT payload with no
  re-validation against the database per request.

## Suggested exercises
- Exploit the SQLi to enumerate other users' private notes.
- Chain the stored XSS with the admin panel to steal an admin's session.
- Walk the IDOR to pull every attachment in the `attachments` table.
- Build a working SSTI payload for the report endpoint and confirm code
  execution (e.g., writing a file or reading an environment variable).
- Harden each endpoint and write a regression test proving the fix.
