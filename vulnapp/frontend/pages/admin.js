import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, getToken } from "../lib/api";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, []);

  async function load() {
    try {
      const [u, n] = await Promise.all([api.adminUsers(), api.adminNotes()]);
      setUsers(u);
      setNotes(n);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Admin</h1>
      {error && <p className="error">{error}</p>}

      <h2>Users</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            #{u.id} {u.email} — {u.role}
          </li>
        ))}
      </ul>

      <h2>All notes</h2>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            <strong>{n.title}</strong> (owner: {n.owner})
          </li>
        ))}
      </ul>
    </div>
  );
}
