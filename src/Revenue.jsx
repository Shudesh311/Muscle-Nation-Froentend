import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ReceiptText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://muscle-nation-gym.onrender.com";

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const monthKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const money = (value) => `Rs.${Number(value || 0)}`;

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const daysUntil = (date) => {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - startOfToday()) / (1000 * 60 * 60 * 24));
};

const renewalStatus = (endDate) => {
  const daysLeft = daysUntil(endDate);

  if (daysLeft < 0) return "Expired";
  if (daysLeft === 0) return "Ends today";
  return `${daysLeft} days left`;
};

export default function Revenue() {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [fees, setFees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [admissionRes, feesRes] = await Promise.all([
          fetch(`${BASE_URL}/admission/list/`),
          fetch(`${BASE_URL}/fees/list/`),
        ]);

        const [admissionData, feesData] = await Promise.all([admissionRes.json(), feesRes.json()]);
        setAdmissions(Array.isArray(admissionData) ? admissionData : []);
        setFees(Array.isArray(feesData) ? feesData : []);
      } catch {
        setAdmissions([]);
        setFees([]);
      }
    };

    loadData();
  }, []);

  const monthOptions = useMemo(() => {
    const months = new Set([currentMonth()]);
    admissions.forEach((item) => months.add(monthKey(item.created_at)));
    fees.forEach((item) => months.add(monthKey(item.created_at)));
    return Array.from(months).filter(Boolean).sort().reverse();
  }, [admissions, fees]);

  const revenue = useMemo(() => {
    const monthAdmissions = admissions.filter((item) => monthKey(item.created_at) === selectedMonth);
    const monthFees = fees.filter((item) => monthKey(item.created_at) === selectedMonth);

    const admissionCash = monthAdmissions.reduce((sum, item) => sum + (Number(item.cash_amount) || 0), 0);
    const admissionGpay = monthAdmissions.reduce((sum, item) => sum + (Number(item.gpay_amount) || 0), 0);
    const renewalCash = monthFees.reduce((sum, item) => {
      const cashAmount = Number(item.cash_amount) || 0;
      const gpayAmount = Number(item.gpay_amount) || 0;

      if (cashAmount + gpayAmount > 0) return sum + cashAmount;
      return item.payment_method === "cash" ? sum + (Number(item.fees) || 0) : sum;
    }, 0);
    const renewalGpay = monthFees.reduce((sum, item) => {
      const cashAmount = Number(item.cash_amount) || 0;
      const gpayAmount = Number(item.gpay_amount) || 0;

      if (cashAmount + gpayAmount > 0) return sum + gpayAmount;
      return item.payment_method === "gpay" ? sum + (Number(item.fees) || 0) : sum;
    }, 0);

    return {
      admissionCash,
      admissionGpay,
      renewalCash,
      renewalGpay,
      total: admissionCash + admissionGpay + renewalCash + renewalGpay,
      records: monthAdmissions.length + monthFees.length,
    };
  }, [admissions, fees, selectedMonth]);

  const renewalFollowUps = useMemo(() => {
    const latestByAdmission = new Map();
    fees.forEach((item) => {
      const existing = latestByAdmission.get(item.admission_id);
      if (!existing || new Date(item.end_date) > new Date(existing.end_date)) {
        latestByAdmission.set(item.admission_id, item);
      }
    });

    const today = startOfToday();
    const tenDaysLater = new Date(today);
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);

    return Array.from(latestByAdmission.values())
      .filter((item) => {
        const endDate = new Date(item.end_date);
        endDate.setHours(0, 0, 0, 0);
        return endDate <= tenDaysLater;
      })
      .filter((item) =>
        [item.name, item.admission_id, item.workout_type]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  }, [fees, search]);

  const cards = [
    ["Total Monthly Profit", revenue.total],
    ["Admission Cash", revenue.admissionCash],
    ["Admission GPay", revenue.admissionGpay],
    ["Renewal Cash", revenue.renewalCash],
    ["Renewal GPay", revenue.renewalGpay],
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="grid h-10 w-10 place-items-center rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Revenue</h1>
              <p className="mt-1 text-sm text-zinc-400">Monthly profit and renewal follow-ups.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-2">
            <CalendarDays size={18} className="text-zinc-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month} className="bg-zinc-950">
                  {month}
                </option>
              ))}
            </select>
          </label>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{money(value)}</p>
            </div>
          ))}
        </section>

        <section className="mb-5 rounded border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2">
            <ReceiptText size={18} className="text-emerald-400" />
            <h2 className="text-lg font-semibold">Monthly Summary</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            {revenue.records} payment records counted for {selectedMonth}.
          </p>
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-900">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Renewal Follow-ups</h2>
              <p className="text-sm text-zinc-400">{renewalFollowUps.length} members expired or ending within 10 days.</p>
            </div>
            <label className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, workout"
                className="w-full rounded border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Admission ID</th>
                  <th className="px-4 py-3">Workout</th>
                  <th className="px-4 py-3">Last Fee</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Finished</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {renewalFollowUps.map((item) => {
                  const daysLeft = daysUntil(item.end_date);

                  return (
                  <tr key={item.id} className="border-t border-zinc-800 hover:bg-zinc-800/60">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-zinc-300">{item.admission_id}</td>
                    <td className="px-4 py-3 capitalize">{item.workout_type}</td>
                    <td className="px-4 py-3">{money(item.fees)}</td>
                    <td className="px-4 py-3">{formatDate(item.start_date)}</td>
                    <td className="px-4 py-3 text-amber-300">{formatDate(item.end_date)}</td>
                    <td className={daysLeft < 0 ? "px-4 py-3 text-red-300" : "px-4 py-3 text-emerald-300"}>
                      {renewalStatus(item.end_date)}
                    </td>
                    <td className="px-4 py-3 capitalize">{item.payment_method || "-"}</td>
                  </tr>
                  );
                })}

                {renewalFollowUps.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center text-zinc-400">
                      No renewal follow-ups in the next 10 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
