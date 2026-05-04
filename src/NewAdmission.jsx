import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, CreditCard, Plus, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RenewFees from "./RenewFees";

const BASE_URL = "https://muscle-nation-gym.onrender.com";
const ADMISSION_FEE = 300;

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500";

export default function NewAdmission() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("admission");
  const [showForm, setShowForm] = useState(false);

  const [admissionId, setAdmissionId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fees, setFees] = useState(String(ADMISSION_FEE));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [gpayAmount, setGpayAmount] = useState("");
  const [photo, setPhoto] = useState(null);

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPaid = (Number(cashAmount) || 0) + (Number(gpayAmount) || 0);
  const balance = (Number(fees) || 0) - totalPaid;

  const fetchAdmissions = async () => {
    const res = await fetch(`${BASE_URL}/admission/list/`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const resetForm = () => {
    setAdmissionId("");
    setName("");
    setPhone("");
    setFees(String(ADMISSION_FEE));
    setPaymentMethod("");
    setCashAmount("");
    setGpayAmount("");
    setPhoto(null);
    setMessage("");
  };

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    setMessage("");

    if (method === "cash") {
      setCashAmount(fees);
      setGpayAmount("");
    } else if (method === "gpay") {
      setCashAmount("");
      setGpayAmount(fees);
    } else if (method === "both") {
      setCashAmount("");
      setGpayAmount("");
    } else {
      setCashAmount("");
      setGpayAmount("");
    }
  };

  const submitAdmission = async () => {
    if (!name.trim() || !phone.trim()) {
      setMessage("Name and phone are required.");
      return;
    }

    if (paymentMethod && totalPaid <= 0) {
      setMessage("Enter the payment amount.");
      return;
    }

    const formData = new FormData();
    formData.append("admission_id", admissionId.trim());
    formData.append("name", name.trim());
    formData.append("phone", phone.trim());
    formData.append("admission_fees", fees || 0);
    formData.append("payment_method", paymentMethod);
    formData.append("cash_amount", cashAmount || 0);
    formData.append("gpay_amount", gpayAmount || 0);
    if (photo) formData.append("photo", photo);

    setLoading(true);
    const res = await fetch(`${BASE_URL}/admission/create/`, {
      method: "POST",
      body: formData,
    });
    setLoading(false);

    if (!res.ok) {
      setMessage("Could not save admission.");
      return;
    }

    resetForm();
    setShowForm(false);
    fetchAdmissions();
  };

  const deleteAdmission = async (id) => {
    const confirmed = window.confirm("Delete this admission record?");
    if (!confirmed) return;

    const res = await fetch(`${BASE_URL}/admission/delete/${id}/`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setMessage("Could not delete admission.");
      return;
    }

    fetchAdmissions();
  };

  const filteredRecords = useMemo(
    () =>
      records.filter((r) =>
        [r.name, r.phone, r.admission_id]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [records, search]
  );

  const totals = useMemo(
    () =>
      records.reduce(
        (sum, record) => ({
          cash: sum.cash + (Number(record.cash_amount) || 0),
          gpay: sum.gpay + (Number(record.gpay_amount) || 0),
        }),
        { cash: 0, gpay: 0 }
      ),
    [records]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
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
              <h1 className="text-2xl font-semibold tracking-normal">New Admission</h1>
              <p className="mt-1 text-sm text-zinc-400">Add members and renew fees from one page.</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-emerald-600 px-4 text-sm font-medium hover:bg-emerald-500"
          >
            <Plus size={18} />
            Add Admission
          </button>
        </header>

        <div className="mb-5 grid gap-2 rounded border border-zinc-800 bg-zinc-900 p-2 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab("admission")}
            className={`h-11 rounded text-sm font-medium ${
              activeTab === "admission" ? "bg-emerald-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            New Admission
          </button>
          <button
            onClick={() => setActiveTab("renewal")}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded text-sm font-medium ${
              activeTab === "renewal" ? "bg-emerald-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <CreditCard size={17} />
            Fees Renewal
          </button>
        </div>

        {activeTab === "renewal" ? (
          <RenewFees embedded />
        ) : (
          <>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Members</p>
            <p className="mt-1 text-2xl font-semibold">{records.length}</p>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">Cash Collection</p>
            <p className="mt-1 text-2xl font-semibold">Rs.{totals.cash}</p>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">GPay Collection</p>
            <p className="mt-1 text-2xl font-semibold">Rs.{totals.gpay}</p>
          </div>
        </section>

        {showForm && (
          <section className="mb-5 rounded border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Member Details</h2>
                <p className="text-sm text-zinc-400">Enter admission and payment information.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="grid h-9 w-9 place-items-center rounded border border-zinc-700 hover:bg-zinc-800"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm text-zinc-300">Admission ID</span>
                  <input
                    placeholder="A001"
                    value={admissionId}
                    onChange={(e) => setAdmissionId(e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm text-zinc-300">Phone</span>
                  <input
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm text-zinc-300">Name</span>
                  <input
                    placeholder="Member name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm text-zinc-300">Photo</span>
                  <div className="flex items-center gap-3 rounded border border-dashed border-zinc-700 bg-zinc-950 p-3">
                    <Camera className="shrink-0 text-zinc-400" size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setPhoto(e.target.files[0])}
                      className="w-full text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-white"
                    />
                  </div>
                </label>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-400" />
                  <h3 className="font-medium">Payment</h3>
                </div>

                <div className="space-y-3">
                  <label className="space-y-1.5">
                    <span className="text-sm text-zinc-300">Admission Fee</span>
                    <input
                      type="number"
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["cash", "Cash"],
                      ["gpay", "GPay"],
                      ["both", "Both"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handlePaymentMethod(value)}
                        className={`h-10 rounded border text-sm font-medium ${
                          paymentMethod === value
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {(paymentMethod === "cash" || paymentMethod === "both") && (
                      <label className="space-y-1.5">
                        <span className="text-sm text-zinc-300">Cash Amount</span>
                        <input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className={inputClass}
                        />
                      </label>
                    )}

                    {(paymentMethod === "gpay" || paymentMethod === "both") && (
                      <label className="space-y-1.5">
                        <span className="text-sm text-zinc-300">GPay Amount</span>
                        <input
                          type="number"
                          value={gpayAmount}
                          onChange={(e) => setGpayAmount(e.target.value)}
                          className={inputClass}
                        />
                      </label>
                    )}
                  </div>

                  <div className="rounded bg-zinc-900 p-3 text-sm text-zinc-300">
                    Paid Rs.{totalPaid} / Fee Rs.{Number(fees) || 0}
                    <span className={balance === 0 ? "text-emerald-400" : "text-amber-400"}>
                      {" "}
                      Balance Rs.{balance}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {message && <p className="mt-4 rounded bg-red-950 px-3 py-2 text-sm text-red-200">{message}</p>}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="h-10 rounded border border-zinc-700 px-4 text-sm hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={submitAdmission}
                disabled={loading}
                className="h-10 rounded bg-emerald-600 px-5 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Admission"}
              </button>
            </div>
          </section>
        )}

        <section className="rounded border border-zinc-800 bg-zinc-900">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">All Admissions</h2>
              <p className="text-sm text-zinc-400">{filteredRecords.length} records shown</p>
            </div>

            <label className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, ID"
                className="w-full rounded border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Admission ID</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Cash</th>
                  <th className="px-4 py-3">GPay</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.photo ? (
                          <img
                            src={`${BASE_URL}${r.photo}`}
                            className="h-11 w-11 rounded object-cover"
                            alt={r.name}
                          />
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded bg-zinc-800 text-sm font-semibold text-zinc-300">
                            {(r.name || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-zinc-500">#{r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{r.admission_id || "-"}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.phone}</td>
                    <td className="px-4 py-3">Rs.{r.admission_fees || 0}</td>
                    <td className="px-4 py-3 capitalize">{r.payment_method || "-"}</td>
                    <td className="px-4 py-3">Rs.{r.cash_amount || 0}</td>
                    <td className="px-4 py-3">Rs.{r.gpay_amount || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteAdmission(r.id)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded border border-red-800 px-3 text-sm text-red-300 hover:bg-red-950"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center text-zinc-400">
                      No admission records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
}
