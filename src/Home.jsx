import { CreditCard, LogOut, ReceiptText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const actions = [
    {
      title: "Admission & Fees",
      description: "Add new members and renew gym fees from one working page.",
      button: "Open",
      icon: CreditCard,
      color: "bg-emerald-600",
      onClick: () => navigate("/new-admission"),
    },
    {
      title: "Revenue",
      description: "See monthly profit by category and members whose fees are finished.",
      button: "View Revenue",
      icon: ReceiptText,
      color: "bg-sky-600",
      onClick: () => navigate("/revenue"),
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">Muscle Nation</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Manage admissions, renewals, monthly revenue, and finished fees.
            </p>
          </div>

          <button
            onClick={logout}
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-red-800 px-4 text-sm text-red-300 hover:bg-red-950"
          >
            <LogOut size={17} />
            Logout
          </button>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Daily Workflow</p>
            <p className="mt-1 text-xl font-semibold">Admissions and renewals</p>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Payments</p>
            <p className="mt-1 text-xl font-semibold">Cash and GPay tracking</p>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Search</p>
            <p className="mt-1 text-xl font-semibold">Fast member lookup</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded border border-zinc-800 bg-zinc-900 p-5">
                <div className={`mb-5 grid h-11 w-11 place-items-center rounded ${item.color}`}>
                  <Icon size={22} />
                </div>
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 min-h-[60px] text-sm leading-6 text-zinc-400">{item.description}</p>
                <button
                  onClick={item.onClick}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-zinc-800 text-sm font-medium hover:bg-zinc-700"
                >
                  <Search size={16} />
                  {item.button}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
