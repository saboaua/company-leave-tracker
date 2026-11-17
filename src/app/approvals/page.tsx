"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRoleAndRequests();
  }, []);

  const loadRoleAndRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", user.id)
      .single();
    setUserRole(profile?.roles);

    if (!profile?.roles?.can_approve && profile?.roles?.name !== "admin") {
      alert("No approval permission");
      return;
    }

    const { data } = await supabase
      .from("leave_requests")
      .select("*, profiles(full_name, email)")
      .in("status", ["pending", "approved"])
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

  const approve = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: req } = await supabase.from("leave_requests").select("*").eq("id", id).single();

    const { error } = await supabase.from("leave_requests").update({
      status: "approved",
      approved_by: user?.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (!error) {
      // Add to taken balance
      const year = new Date(req.start_date).getFullYear();
      const field = req.type === "medical" ? "sick_taken" : req.type === "special" ? "special_taken" : "vacation_taken";
      await supabase.rpc("increment_taken", { p_user_id: req.user_id, p_year: year, p_field: field, p_days: req.days }).catch(() => {
        // Fallback: manual update if RPC not created
        supabase.from("leave_balances").upsert({
          user_id: req.user_id,
          year,
          [field]: req.days,
        }, { onConflict: "user_id,year" });
      });

      await supabase.from("leave_request_history").insert({
        request_id: id,
        action: "approved",
        changed_by: user?.id,
        old_data: req,
        comment: "Approved by approver",
      });

      // TODO: Telegram notification
      loadRoleAndRequests();
    }
  };

  const pullBack = async (id: string) => {
    const comment = prompt("Mandatory comment for pull-back:");
    if (!comment?.trim()) return alert("Comment required");

    const { data: { user } } = await supabase.auth.getUser();
    const { data: req } = await supabase.from("leave_requests").select("*").eq("id", id).single();

    const { error } = await supabase.from("leave_requests").update({
      status: "cancelled",
      cancelled_by: user?.id,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (!error) {
      // Recalculate: subtract days from taken
      const year = new Date(req.start_date).getFullYear();
      const field = req.type === "medical" ? "sick_taken" : req.type === "special" ? "special_taken" : "vacation_taken";

      const { data: bal } = await supabase.from("leave_balances").select(field).eq("user_id", req.user_id).eq("year", year).single();
      const current = bal?.[field] || 0;
      await supabase.from("leave_balances").update({ [field]: Math.max(0, current - req.days) }).eq("user_id", req.user_id).eq("year", year);

      await supabase.from("leave_request_history").insert({
        request_id: id,
        action: "pulled_back",
        changed_by: user?.id,
        old_data: req,
        new_data: { status: "cancelled" },
        comment,
      });

      // TODO: Telegram notify user
      loadRoleAndRequests();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Approvals</h1>

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between">
              <div>
                <strong>{r.profiles?.full_name || r.profiles?.email}</strong> — {r.type} · {r.start_date} to {r.end_date} ({r.days}d)
                <p className="text-sm text-gray-600">Reason: {r.reason}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${r.status === "approved" ? "bg-green-100" : "bg-yellow-100"}`}>{r.status}</span>
            </div>
            <div className="mt-3 flex gap-2 text-sm">
              {r.status === "pending" && <button onClick={() => approve(r.id)} className="text-green-600">Approve</button>}
              {r.status === "approved" && (userRole?.can_modify_approved || userRole?.name === "admin") && (
                <button onClick={() => pullBack(r.id)} className="text-orange-600">Pull Back</button>
              )}
              <button onClick={() => loadHistory(r.id)} className="text-gray-600">History</button>
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">History</h2>
          <button onClick={() => setSelectedRequest(null)} className="text-sm mb-4">Close</button>
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="border-b pb-2">
                <strong className="capitalize">{h.action}</strong> by {h.profiles?.full_name || "User"} — {new Date(h.created_at).toLocaleString()}
                {h.comment && <p>Comment: {h.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
