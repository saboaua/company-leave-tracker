"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return window.location.href = "/";
      setUser(user);

      const year = new Date().getFullYear();
      const { data } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", user.id)
        .eq("year", year)
        .single();
      setBalance(data);
    };
    load();
  }, []);

  if (!user) return <div className="p-8">Loading...</div>;

  const allocated = balance?.vacation_allocated ?? 20;
  const taken = balance?.vacation_taken ?? 0;
  const remaining = allocated - taken + (balance?.carry_forward ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
      <p className="text-gray-600 mb-8">{user.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Vacation Allocated</h2>
          <p className="text-3xl font-bold text-blue-600">{allocated}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Taken</h2>
          <p className="text-3xl font-bold text-orange-600">{taken}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-sm text-gray-500">Remaining + Carry</h2>
          <p className="text-3xl font-bold text-green-600">{remaining}</p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <a href="/requests" className="px-6 py-3 bg-blue-600 text-white rounded-lg">Request Time Off</a>
        <a href="/calendar" className="px-6 py-3 bg-gray-200 rounded-lg">View Calendar</a>
      </div>
    </div>
  );
}
