import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { api, getToken } from "../lib/api";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const data = await api.listNotes();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.createNote(title, content, isPublic);
      setTitle("");
      setContent("");
      setIsPublic(false);
      loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    try {
      const data = await api.searchNotes(query);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div>
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin">Admin</Link>
        <button onClick={logout}>Logout</button>
      </nav>
      <h1>Your Notes</h1>

      <form onSubmit={handleSearch}>
        <label>Search by title</label>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search..." />
        <button type="submit">Search</button>
        <button type="button" onClick={loadNotes}>Reset</button>
      </form>

      <h2>New note</h2>
      <form onSubmit={handleCreate}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>Content (HTML allowed)</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} required />
        <label>
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          {" "}Make public
        </label>
        <button type="submit">Save note</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Notes</h2>
      {notes.map((note) => (
        <div className="note-card" key={note.id}>
          <strong>
            <Link href={`/notes/${note.id}`}>{note.title}</Link>
          </strong>
          {note.is_public && <span> (public)</span>}
        </div>
      ))}
    </div>
  );
}
