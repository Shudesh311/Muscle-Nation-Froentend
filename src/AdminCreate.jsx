import { useState } from "react";
import { ShieldPlus } from "lucide-react";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://muscle-nation-gym.onrender.com";

export default function AdminCreate() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    if (!username.trim() || !password.trim()) {
      setMessage("Username and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/admin/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Admin created.");
        setUsername("");
        setPassword("");
      } else {
        setMessage(data.error || "Could not create admin.");
      }
    } catch {
      setMessage("Server is not reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white">
      <section className="w-full max-w-md rounded border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded bg-emerald-600">
            <ShieldPlus size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Create Admin</h1>
            <p className="text-sm text-zinc-400">Add a new dashboard user.</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <p className="rounded bg-zinc-950 px-3 py-2 text-sm text-zinc-200">{message}</p>}

          <button
            onClick={createUser}
            disabled={loading}
            className="h-11 w-full rounded bg-emerald-600 text-sm font-medium hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </section>
    </main>
  );
}
