"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "vacation", start_date: "", end_date: "", reason: "" });
  const supabase = createClient();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { error } = await supabase.from("leave_requests").insert({
      user_id: user.id,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      days,
      reason: form.reason,
      status: "pending",
    });

    if (!error) {
      setShowForm(false);
      loadRequests();
      // TODO: Send Telegram notification
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Time Off Requests</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          New Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitRequest} className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 border rounded">
            <option value="vacation">Vacation</option>
            <option value="special">Special Leave</option>
            <option value="medical">Medical / Sick</option>
          </select>
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full p-2 border rounded" required />
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full p-2 border rounded" required />
          <textarea placeholder="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full p-2 border rounded" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-lg shadow flex justify-between">
            <div>
              <span className="font-medium capitalize">{r.type}</span> · {r.start_date} to {r.end_date} ({r.days} days)
              <p className="text-sm text-gray-500">{r.reason}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "denied" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
