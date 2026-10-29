import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>VulnApp Notes</h1>
      <p>A deliberately vulnerable notes app for security research/training.</p>
      <nav>
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </div>
  );
}
