"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SecurityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: sec } = await supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(50);
      const { data: aud } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setEvents(sec || []);
      setLogs(aud || []);
    };
    load();
  }, []);

  const chartData = events.reduce((acc: any, e) => {
    const type = e.type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(chartData).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Security & Audit Trail</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Security Events</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Audit Logs</h2>
          <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
            {logs.slice(0, 10).map((l) => (
              <li key={l.id} className="border-b pb-1">{l.action} — {new Date(l.created_at).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Implement middleware to log brute-force attempts, suspicious SQL patterns, and all admin actions.
      </p>
    </div>
  );
}
