import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, getToken } from "../../lib/api";

export default function NoteDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachmentId, setAttachmentId] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (id) loadNote();
  }, [id]);

  async function loadNote() {
    try {
      const data = await api.getNote(id);
      setNote(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const updated = await api.updateNote(id, title, content);
      setNote(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFetchAttachment(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.getAttachment(id, attachmentId);
      setAttachment(data);
    } catch (err) {
      setError(err.message);
      setAttachment(null);
    }
  }

  async function handleGenerateReport() {
    setError("");
    try {
      const data = await api.generateReport(id);
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!note) return <p>Loading...</p>;

  return (
    <div>
      <h1>{note.title}</h1>

      {/* VULNERABILITY: stored XSS - note content is rendered as raw HTML
          with no sanitization, so a script tag saved in the note content
          will execute in the browser of anyone who views this note. */}
      <div
        style={{ border: "1px solid #eee", padding: 12, marginBottom: 16 }}
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      <h2>Edit</h2>
      <form onSubmit={handleSave}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
        <button type="submit">Save</button>
      </form>

      <h2>Fetch attachment</h2>
      <p>Look up an attachment by its ID (try IDs belonging to other notes).</p>
      <form onSubmit={handleFetchAttachment}>
        <input
          placeholder="attachment id"
          value={attachmentId}
          onChange={(e) => setAttachmentId(e.target.value)}
        />
        <button type="submit">Fetch</button>
      </form>
      {attachment && (
        <pre>{JSON.stringify(attachment, null, 2)}</pre>
      )}

      <h2>Generate report</h2>
      <p>Compiles this note's content server-side as a template.</p>
      <button onClick={handleGenerateReport}>Generate</button>
      {report && <pre>{report}</pre>}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
