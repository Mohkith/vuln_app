// Relative path - goes through the Next.js rewrite proxy defined in
// next.config.js, so the browser always calls its own origin regardless
// of what host/IP it's viewing the app from.
const API_URL = "";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (email, password) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  listNotes: () => request("/api/notes"),
  createNote: (title, content, is_public) =>
    request("/api/notes", {
      method: "POST",
      body: JSON.stringify({ title, content, is_public }),
    }),
  getNote: (id) => request(`/api/notes/${id}`),
  updateNote: (id, title, content) =>
    request(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, content }),
    }),
  searchNotes: (q) => request(`/api/notes/search?q=${encodeURIComponent(q)}`),
  getAttachment: (noteId, attachmentId) =>
    request(`/api/notes/${noteId}/attachments/${attachmentId}`),
  generateReport: (id) =>
    request(`/api/notes/${id}/report`, { method: "POST" }),
  adminUsers: () => request("/api/admin/users"),
  adminNotes: () => request("/api/admin/notes"),
};

export { getToken, API_URL };
