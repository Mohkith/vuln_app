CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- stored as plain MD5 hash (intentionally weak)
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id),
  filename VARCHAR(255) NOT NULL,
  content TEXT NOT NULL -- base64 blob, kept simple for the demo
);

-- Seed an admin and a regular user (password for both is "password123", md5-hashed)
INSERT INTO users (email, password, role) VALUES
  ('admin@vulnapp.local', md5('password123'), 'admin'),
  ('alice@vulnapp.local', md5('password123'), 'user'),
  ('bob@vulnapp.local', md5('password123'), 'user')
ON CONFLICT DO NOTHING;

INSERT INTO notes (user_id, title, content, is_public) VALUES
  (2, 'Alice private note', 'This is a secret note belonging to Alice.', false),
  (3, 'Bob private note', 'Bob keeps his notes here.', false)
ON CONFLICT DO NOTHING;

INSERT INTO attachments (note_id, filename, content) VALUES
  (1, 'alice-secret.txt', 'QWxpY2UncyBjb25maWRlbnRpYWwgYXR0YWNobWVudA=='),
  (2, 'bob-secret.txt', 'Qm9iJ3MgY29uZmlkZW50aWFsIGF0dGFjaG1lbnQ=')
ON CONFLICT DO NOTHING;
