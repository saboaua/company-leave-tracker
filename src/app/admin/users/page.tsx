"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UsersPage() {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    employment_start_date: "",
    birthday: "",
    starting_vacation_balance: "0",
    vacation_days_annual: "20",
    role: "employee",
  });
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employment_start_date || !form.starting_vacation_balance) {
      return alert("Employment start date and starting vacation balance are required");
    }

    // Note: In production use service role or invite flow. This is a skeleton.
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: "TempPass123!",
      email_confirm: true,
    }).catch(() => ({ data: null, error: { message: "Admin create requires service role" } }));

    if (authError) {
      setMessage("User creation requires Supabase service role key on server. Create via Supabase dashboard then fill profile.");
      return;
    }

    const userId = authUser?.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        email: form.email,
        full_name: form.full_name,
        employment_start_date: form.employment_start_date,
        birthday: form.birthday || null,
        starting_vacation_balance: parseFloat(form.starting_vacation_balance),
        vacation_days_annual: parseInt(form.vacation_days_annual),
      });

      const year = new Date().getFullYear();
      await supabase.from("leave_balances").upsert({
        user_id: userId,
        year,
        vacation_allocated: parseFloat(form.starting_vacation_balance),
        vacation_taken: 0,
      }, { onConflict: "user_id,year" });
    }

    setMessage("Profile ready (auth user creation may need service role).");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Create User</h1>
      <form onSubmit={createUser} className="bg-white p-6 rounded-xl shadow max-w-lg space-y-4">
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded" required />
        <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full p-2 border rounded" />
        <div>
          <label className="text-sm text-gray-600">Employment Start Date *</label>
          <input type="date" value={form.employment_start_date} onChange={e => setForm({...form, employment_start_date: e.target.value})} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="text-sm text-gray-600">Birthday (for calendar)</label>
          <input type="date" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Starting Vacation Balance *</label>
          <input type="number" step="0.5" value={form.starting_vacation_balance} onChange={e => setForm({...form, starting_vacation_balance: e.target.value})} className="w-full p-2 border rounded" required />
        </div>
        <input type="number" placeholder="Annual Vacation Days" value={form.vacation_days_annual} onChange={e => setForm({...form, vacation_days_annual: e.target.value})} className="w-full p-2 border rounded" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  );
}
