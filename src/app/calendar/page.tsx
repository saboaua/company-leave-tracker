"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("*, profiles(full_name, email)")
        .eq("status", "approved")
        .gte("end_date", new Date().toISOString().split("T")[0]);
      setEvents(data || []);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Out of Office Calendar</h1>
      <div className="bg-white rounded-xl shadow p-6">
        {events.length === 0 ? (
          <p className="text-gray-500">No one is currently out.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between border-b pb-2">
                <span>{e.profiles?.full_name || e.profiles?.email || "User"}</span>
                <span className="capitalize text-sm text-gray-600">{e.type} · {e.start_date} → {e.end_date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-500">Full interactive calendar (FullCalendar or similar) can be added here.</p>
    </div>
  );
}
