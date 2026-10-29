const express = require("express");
const Handlebars = require("handlebars");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/notes - list the current user's notes (safe, parameterized)
router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT id, title, content, is_public, created_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/notes - create a note.
// VULNERABILITY: content is stored and later rendered on the frontend via
// dangerouslySetInnerHTML with no sanitization -> stored XSS.
router.post("/", async (req, res) => {
  const { title, content, is_public } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "title and content required" });
  }
  const result = await pool.query(
    "INSERT INTO notes (user_id, title, content, is_public) VALUES ($1, $2, $3, $4) RETURNING *",
    [req.user.id, title, content, !!is_public]
  );
  res.status(201).json(result.rows[0]);
});

// GET /api/notes/search?q=...
// VULNERABILITY: SQL Injection. The query term is concatenated directly
// into the SQL string instead of using a parameterized query.
router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  const sql = `SELECT id, title, content, is_public, user_id
               FROM notes
               WHERE (user_id = ${req.user.id} OR is_public = true)
               AND title ILIKE '%${q}%'`;
  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Search failed", detail: err.message });
  }
});

// GET /api/notes/:id - fetch one note (own note or a public one)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM notes WHERE id = $1 AND (user_id = $2 OR is_public = true)",
    [id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Note not found" });
  }
  res.json(result.rows[0]);
});

// PUT /api/notes/:id - update own note
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const result = await pool.query(
    "UPDATE notes SET title = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
    [title, content, id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Note not found" });
  }
  res.json(result.rows[0]);
});

// GET /api/notes/:id/attachments/:attachmentId
// VULNERABILITY: Non-basic IDOR / BOLA. The middleware correctly checks
// that :id belongs to the requesting user, but the attachment lookup then
// fetches :attachmentId by its own primary key WITHOUT verifying that the
// attachment actually belongs to note :id. An attacker who owns any note
// (even an empty one they just created) can pair its id with an arbitrary
// attachmentId to read other users' attachments - the ownership check on
// the parent resource is treated as sufficient authorization for the
// child resource, which it isn't.
router.get("/:id/attachments/:attachmentId", async (req, res) => {
  const { id, attachmentId } = req.params;

  const noteCheck = await pool.query(
    "SELECT id FROM notes WHERE id = $1 AND user_id = $2",
    [id, req.user.id]
  );
  if (noteCheck.rows.length === 0) {
    return res.status(404).json({ error: "Note not found" });
  }

  // Bug: looks up the attachment by its own id only, not scoped to :id.
  const attachment = await pool.query(
    "SELECT * FROM attachments WHERE id = $1",
    [attachmentId]
  );
  if (attachment.rows.length === 0) {
    return res.status(404).json({ error: "Attachment not found" });
  }
  res.json(attachment.rows[0]);
});

// POST /api/notes/:id/report
// VULNERABILITY: Server-Side Template Injection -> RCE. The note's content
// is compiled directly as a Handlebars template string supplied by the
// user and rendered server-side, with no sandboxing of the template
// source. Handlebars templates that reach into constructor/prototype
// chains can be used to execute arbitrary code in the Node process.
router.post("/:id/report", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM notes WHERE id = $1 AND user_id = $2",
    [id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Note not found" });
  }
  const note = result.rows[0];

  try {
    // note.content is attacker-controlled and compiled as a template.
    const template = Handlebars.compile(note.content, { noEscape: true });
    const rendered = template({ title: note.title, author: req.user.email });
    res.json({ report: rendered });
  } catch (err) {
    res.status(500).json({ error: "Report generation failed", detail: err.message });
  }
});

module.exports = router;
