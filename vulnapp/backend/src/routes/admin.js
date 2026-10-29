const express = require("express");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/users - list all users (admin only)
router.get("/users", async (req, res) => {
  const result = await pool.query(
    "SELECT id, email, role, created_at FROM users ORDER BY id"
  );
  res.json(result.rows);
});

// GET /api/admin/notes - list all notes across all users (admin only)
router.get("/notes", async (req, res) => {
  const result = await pool.query(
    `SELECT notes.id, notes.title, notes.content, notes.is_public, users.email AS owner
     FROM notes JOIN users ON notes.user_id = users.id
     ORDER BY notes.created_at DESC`
  );
  res.json(result.rows);
});

module.exports = router;
