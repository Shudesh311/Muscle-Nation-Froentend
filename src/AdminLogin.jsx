import { useState } from "react";
import { Dumbbell, Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://muscle-nation-gym.onrender.com";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loginAdmin = async () => {
    if (!username.trim() || !password.trim()) {
      setMessage("Please enter username and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) localStorage.setItem("token", data.token);
        navigate("/home");
      } else {
        setMessage(data.error || "Invalid username or password.");
      }
    } catch {
      setMessage("Backend is not reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded bg-emerald-600">
            <Dumbbell size={28} />
          </div>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-normal">
            Muscle Nation
          </h1>
          <p className="mt-4 max-w-lg text-lg text-zinc-400">
            Manage admissions, renewals, member photos, and daily collections from one focused workspace.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {["Admissions", "Renewals", "Payments"].map((item) => (
              <div key={item} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-sm text-zinc-400">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-900 p-5 shadow-2xl sm:p-7">
          <div className="mb-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded bg-emerald-600 lg:hidden">
              <Dumbbell size={22} />
            </div>
            <h2 className="text-2xl font-semibold">Admin Login</h2>
            <p className="mt-1 text-sm text-zinc-400">Sign in to continue to Muscle Nation.</p>
          </div>

          <div className="space-y-4">
            <label className="space-y-1.5">
              <span className="text-sm text-zinc-300">Username</span>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="Enter username"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm text-zinc-300">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loginAdmin();
                  }}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-11 text-sm outline-none focus:border-emerald-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {message && <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-200">{message}</p>}

            <button
              onClick={loginAdmin}
              disabled={loading}
              className="h-11 w-full rounded bg-emerald-600 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
