"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "vacation", start_date: "", end_date: "", reason: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRequests();
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .single();
    setUserRole(data?.roles);
  };

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

  const loadHistory = async (requestId: string) => {
    const { data } = await supabase
      .from("leave_request_history")
      .select("*, profiles:changed_by(full_name, email)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    setHistory(data || []);
    setSelectedRequest(requestId);
  };

  const openEdit = (req: any) => {
    setForm({
      type: req.type,
      start_date: req.start_date,
      end_date: req.end_date,
      reason: req.reason,
    });
    setEditingId(req.id);
    setShowForm(true);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      alert("Reason/comment is mandatory");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (editingId) {
      // Edit pending request
      const { data: old } = await supabase.from("leave_requests").select("*").eq("id", editingId).single();
      const { error } = await supabase.from("leave_requests").update({
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        days,
        reason: form.reason,
        updated_at: new Date().toISOString(),
      }).eq("id", editingId).eq("status", "pending");

      if (!error) {
        await supabase.from("leave_request_history").insert({
          request_id: editingId,
          action: "edited",
          changed_by: user.id,
          old_data: old,
          new_data: { ...form, days },
          comment: "User edited pending request",
        });
      }
    } else {
      // New request
      const { data: inserted, error } = await supabase.from("leave_requests").insert({
        user_id: user.id,
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        days,
        reason: form.reason,
        status: "pending",
      }).select().single();

      if (!error && inserted) {
        await supabase.from("leave_request_history").insert({
          request_id: inserted.id,
          action: "created",
          changed_by: user.id,
          new_data: inserted,
          comment: "Request created",
        });
      }
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ type: "vacation", start_date: "", end_date: "", reason: "" });
    loadRequests();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this pending request?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: old } = await supabase.from("leave_requests").select("*").eq("id", id).single();

    const { error } = await supabase.from("leave_requests").delete().eq("id", id).eq("status", "pending");
    if (!error) {
      await supabase.from("leave_request_history").insert({
        request_id: id,
        action: "deleted",
        changed_by: user?.id,
        old_data: old,
        comment: "User deleted pending request",
      });
      loadRequests();
    }
  };

  const pullBack = async (id: string) => {
    if (!confirm("Pull back this approved request? This will cancel it and require a comment.")) return;
    const comment = prompt("Mandatory comment for pull-back:");
    if (!comment?.trim()) {
      alert("Comment is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: old } = await supabase.from("leave_requests").select("*").eq("id", id).single();

    const { error } = await supabase.from("leave_requests").update({
      status: "cancelled",
      cancelled_by: user?.id,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (!error) {
      await supabase.from("leave_request_history").insert({
        request_id: id,
        action: "pulled_back",
        changed_by: user?.id,
        old_data: old,
        new_data: { status: "cancelled" },
        comment,
      });
      loadRequests();
    }
  };

  const canModifyApproved = userRole?.can_modify_approved || userRole?.name === "admin";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Time Off Requests</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ type: "vacation", start_date: "", end_date: "", reason: "" }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          New Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitRequest} className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">
          <h2 className="font-semibold">{editingId ? "Edit Request" : "New Request"}</h2>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 border rounded">
            <option value="vacation">Vacation</option>
            <option value="special">Special Leave</option>
            <option value="medical">Medical / Sick</option>
          </select>
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full p-2 border rounded" required />
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full p-2 border rounded" required />
          <textarea placeholder="Reason / Comment (mandatory)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full p-2 border rounded" required />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium capitalize">{r.type}</span> · {r.start_date} to {r.end_date} ({r.days} days)
                <p className="text-sm text-gray-600 mt-1"><strong>Reason:</strong> {r.reason}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "denied" ? "bg-red-100 text-red-800" : r.status === "cancelled" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}`}>
                {r.status}
              </span>
            </div>
            <div className="mt-3 flex gap-2 text-sm">
              {r.status === "pending" && (
                <>
                  <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => deleteRequest(r.id)} className="text-red-600 hover:underline">Delete</button>
                </>
              )}
              {r.status === "approved" && canModifyApproved && (
                <button onClick={() => pullBack(r.id)} className="text-orange-600 hover:underline">Pull Back</button>
              )}
              <button onClick={() => loadHistory(r.id)} className="text-gray-600 hover:underline">History</button>
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Request History</h2>
          <button onClick={() => setSelectedRequest(null)} className="text-sm text-gray-500 mb-4">Close</button>
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="border-b pb-2">
                <strong className="capitalize">{h.action}</strong> by {h.profiles?.full_name || h.profiles?.email || "User"} 
                — {new Date(h.created_at).toLocaleString()}
                {h.comment && <p className="text-gray-600">Comment: {h.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
