"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: leaves } = await supabase
        .from("leave_requests")
        .select("*, profiles(full_name, email)")
        .eq("status", "approved")
        .gte("end_date", new Date().toISOString().split("T")[0]);
      setEvents(leaves || []);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("full_name, email, birthday, employment_start_date");
      setBirthdays(profiles || []);
    };
    load();
  }, []);

  const today = new Date();
  const upcomingBirthdays = birthdays.filter(p => {
    if (!p.birthday) return false;
    const bday = new Date(p.birthday);
    return bday.getMonth() === today.getMonth() || (bday.getMonth() === (today.getMonth() + 1) % 12);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Out of Office & Birthdays</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold mb-3">Who is out</h2>
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

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-3">Upcoming Birthdays</h2>
        {upcomingBirthdays.length === 0 ? (
          <p className="text-gray-500">No upcoming birthdays.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingBirthdays.map((p) => (
              <li key={p.email}>
                {p.full_name || p.email} — {p.birthday}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">Full interactive calendar can be added here. Employment start dates are stored for anniversary tracking.</p>
    </div>
  );
}
