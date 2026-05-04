import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://muscle-nation-gym.onrender.com";

const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const formatYYYYMMDD = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const fieldClass =
  "w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500";

const getFeeAmount = (workoutType, months) => {
  if (workoutType === "strength") {
    return months === 1 ? 800 : 1800;
  }

  return months === 1 ? 1200 : 2700;
};

const shiftMonths = (dateStr, months) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < day) date.setDate(0);
  return formatYYYYMMDD(date);
};

export default function RenewGymFees({ embedded = false }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [latestFee, setLatestFee] = useState(null);

  const [workout, setWorkout] = useState("strength");
  const [duration, setDuration] = useState(1);
  const [payment, setPayment] = useState("cash");
  const [cashAmount, setCashAmount] = useState(800);
  const [gpayAmount, setGpayAmount] = useState(0);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(shiftMonths(getToday(), 1));
  const [feesRecords, setFeesRecords] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/fees/list/`);
      const data = await res.json();
      setFeesRecords(Array.isArray(data) ? data : []);
    } catch {
      setFeesRecords([]);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL}/search-admission/?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const setPaymentAmounts = (method, amount) => {
    setPayment(method);

    if (method === "cash") {
      setCashAmount(amount);
      setGpayAmount(0);
      return;
    }

    if (method === "gpay") {
      setCashAmount(0);
      setGpayAmount(amount);
      return;
    }

    setCashAmount(amount / 2);
    setGpayAmount(amount / 2);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearch(`${user.admission_id} - ${user.name}`);
    setMessage("");

    const latest = feesRecords
      .filter((f) => f.admission_id === user.admission_id)
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];

    if (latest) {
      setLatestFee(latest);
      setWorkout(latest.workout_type);
      setDuration(latest.duration_months);

      const nextStart = new Date(latest.end_date);
      nextStart.setDate(nextStart.getDate() + 1);
      const nextStartStr = formatYYYYMMDD(nextStart);
      setStartDate(nextStartStr);
      setEndDate(shiftMonths(nextStartStr, latest.duration_months));
      const latestCash = Number(latest.cash_amount) || 0;
      const latestGpay = Number(latest.gpay_amount) || 0;
      const latestAmount = Number(latest.fees) || getFeeAmount(latest.workout_type, latest.duration_months);
      setPaymentAmounts(latest.payment_method || "cash", latestAmount);

      if (latestCash + latestGpay > 0) {
        setCashAmount(latestCash);
        setGpayAmount(latestGpay);
      }
    } else {
      setLatestFee(null);
      setWorkout("strength");
      setDuration(1);
      setStartDate(getToday());
      setEndDate(shiftMonths(getToday(), 1));
      setPaymentAmounts("cash", getFeeAmount("strength", 1));
    }
  };

  const feesAmount = getFeeAmount(workout, duration);
  const totalPaid = (Number(cashAmount) || 0) + (Number(gpayAmount) || 0);

  const handlePaymentChange = (method) => {
    setPaymentAmounts(method, feesAmount);
  };

  const renewFees = async () => {
    if (!selectedUser) {
      setMessage("Select a member first.");
      return;
    }

    setLoading(true);
    setMessage("");

    if (totalPaid !== feesAmount) {
      setMessage("Cash and GPay amounts must match the fees.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/fees/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_id: selectedUser.admission_id,
          workout_type: workout,
          duration,
          payment_method: payment,
          cash_amount: cashAmount || 0,
          gpay_amount: gpayAmount || 0,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not renew fees.");
        return;
      }

      setMessage(data.message || "Fees renewed successfully.");
      setSelectedUser(null);
      setSearch("");
      setLatestFee(null);
      fetchFees();
    } catch {
      setMessage("Error renewing fees.");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(
    () =>
      feesRecords.reduce(
        (sum, item) => ({
          amount: sum.amount + (Number(item.fees) || 0),
          active: sum.active + (new Date(item.end_date) >= new Date(getToday()) ? 1 : 0),
        }),
        { amount: 0, active: 0 }
      ),
    [feesRecords]
  );

  const content = (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {!embedded && (
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
              <h1 className="text-2xl font-semibold">Renew Fees</h1>
              <p className="mt-1 text-sm text-zinc-400">Search a member and create a new fee renewal.</p>
            </div>
          </div>
        </header>
        )}

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Renewal Records</p>
            <p className="mt-1 text-2xl font-semibold">{feesRecords.length}</p>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Active Renewals</p>
            <p className="mt-1 text-2xl font-semibold">{totals.active}</p>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Renewal Revenue</p>
            <p className="mt-1 text-2xl font-semibold">Rs.{totals.amount}</p>
          </div>
        </section>

        <section className="mb-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-lg font-semibold">Find Member</h2>
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <input
                type="text"
                placeholder="Search admission ID or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 py-3 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            {searchResults.length > 0 && (
              <div className="mt-3 max-h-72 overflow-auto rounded border border-zinc-800">
                {searchResults.map((u) => (
                  <button
                    key={u.admission_id}
                    onClick={() => selectUser(u)}
                    className="flex w-full items-center gap-3 border-b border-zinc-800 p-3 text-left last:border-b-0 hover:bg-zinc-800"
                  >
                    {u.photo ? (
                      <img src={`${BASE_URL}${u.photo}`} className="h-11 w-11 rounded object-cover" alt={u.name} />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded bg-zinc-800 font-semibold">
                        {(u.name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-zinc-400">{u.admission_id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-400" />
              <h2 className="text-lg font-semibold">Renewal Details</h2>
            </div>

            {!selectedUser ? (
              <div className="grid min-h-[260px] place-items-center rounded border border-dashed border-zinc-700 text-center text-zinc-400">
                Select a member to renew fees.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded bg-zinc-950 p-3">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-zinc-400">{selectedUser.admission_id}</p>
                  {latestFee && (
                    <p className="mt-2 rounded bg-amber-950 px-3 py-2 text-sm text-amber-200">
                      Last fee ends on {formatYYYYMMDD(latestFee.end_date)}
                    </p>
                  )}
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm text-zinc-300">Admission ID</span>
                  <input
                    value={selectedUser.admission_id}
                    readOnly
                    className={fieldClass}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm text-zinc-300">Workout</span>
                    <select
                      className={fieldClass}
                      value={workout}
                      onChange={(e) => {
                        const nextWorkout = e.target.value;
                        setWorkout(nextWorkout);
                        setPaymentAmounts(payment, getFeeAmount(nextWorkout, Number(duration)));
                      }}
                    >
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm text-zinc-300">Duration</span>
                    <select
                      className={fieldClass}
                      value={duration}
                      onChange={(e) => {
                        const nextDuration = Number(e.target.value);
                        setDuration(nextDuration);
                        setPaymentAmounts(payment, getFeeAmount(workout, nextDuration));
                        if (startDate) {
                          setEndDate(shiftMonths(startDate, nextDuration));
                        }
                      }}
                    >
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm text-zinc-300">Start Date</span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={startDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStartDate(value);
                        if (value) {
                          setEndDate(shiftMonths(value, Number(duration)));
                        }
                      }}
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm text-zinc-300">End Date</span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </label>
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm text-zinc-300">Payment</span>
                  <select className={fieldClass} value={payment} onChange={(e) => handlePaymentChange(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="gpay">GPay</option>
                    <option value="both">Cash + GPay</option>
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(payment === "cash" || payment === "both") && (
                    <label className="space-y-1.5">
                      <span className="text-sm text-zinc-300">Cash Amount</span>
                      <input
                        type="number"
                        min="0"
                        className={fieldClass}
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                      />
                    </label>
                  )}

                  {(payment === "gpay" || payment === "both") && (
                    <label className="space-y-1.5">
                      <span className="text-sm text-zinc-300">GPay Amount</span>
                      <input
                        type="number"
                        min="0"
                        className={fieldClass}
                        value={gpayAmount}
                        onChange={(e) => setGpayAmount(e.target.value)}
                      />
                    </label>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded bg-zinc-950 p-3">
                    <p className="text-sm text-zinc-400">Fees</p>
                    <p className="text-2xl font-semibold">Rs.{feesAmount}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Strength: 1 month Rs.800, 3 months Rs.1800
                    </p>
                    <p className="text-xs text-zinc-500">
                      Cardio: 1 month Rs.1200, 3 months Rs.2700
                    </p>
                  </div>
                  <div className="rounded bg-zinc-950 p-3">
                    <p className="text-sm text-zinc-400">Manual dates</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Start: {startDate}
                    </p>
                    <p className="text-sm text-zinc-300">
                      End: {endDate || "-"}
                    </p>
                  </div>
                </div>

                {message && <p className="rounded bg-zinc-950 px-3 py-2 text-sm text-zinc-200">{message}</p>}

                <button
                  onClick={renewFees}
                  disabled={loading}
                  className="h-11 w-full rounded bg-emerald-600 text-sm font-medium hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Confirm Renewal"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 p-4">
            <h2 className="text-lg font-semibold">Renewal History</h2>
            <p className="text-sm text-zinc-400">Latest fee records appear first.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Admission ID</th>
                  <th className="px-4 py-3">Workout</th>
                  <th className="px-4 py-3">Fees</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Cash</th>
                  <th className="px-4 py-3">GPay</th>
                </tr>
              </thead>
              <tbody>
                {feesRecords.map((f) => (
                  <tr key={f.id} className="border-t border-zinc-800 hover:bg-zinc-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {f.photo ? (
                          <img src={`${BASE_URL}${f.photo}`} className="h-10 w-10 rounded object-cover" alt={f.name} />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded bg-zinc-800 font-semibold">
                            {(f.name || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{f.admission_id}</td>
                    <td className="px-4 py-3 capitalize">{f.workout_type}</td>
                    <td className="px-4 py-3">Rs.{f.fees}</td>
                    <td className="px-4 py-3">{formatYYYYMMDD(f.start_date)}</td>
                    <td className="px-4 py-3">{formatYYYYMMDD(f.end_date)}</td>
                    <td className="px-4 py-3 capitalize">{f.payment_method}</td>
                    <td className="px-4 py-3">Rs.{f.cash_amount || 0}</td>
                    <td className="px-4 py-3">Rs.{f.gpay_amount || 0}</td>
                  </tr>
                ))}
                {feesRecords.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-zinc-400">
                      No renewal records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
  );

  return embedded ? content : <main className="min-h-screen bg-zinc-950 text-white">{content}</main>;
}
