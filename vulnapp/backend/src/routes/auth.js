const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    const hashed = md5(password); // intentionally weak hashing, matches seed data
    const result = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
      [email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ token, user });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    const hashed = md5(password);
    const result = await pool.query(
      "SELECT id, email, role FROM users WHERE email = $1 AND password = $2",
      [email, hashed]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
