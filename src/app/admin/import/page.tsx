"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const downloadTemplate = () => {
    const csv = "email,type,start_date,end_date,days,reason,status\nuser@example.com,vacation,2026-01-15,2026-01-20,6,Imported past leave,approved\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vacation_import_template.csv";
    a.click();
  };

  const handleImport = async () => {
    if (!file) return alert("Select a CSV file");
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1); // skip header

    let success = 0;
    for (const line of lines) {
      const [email, type, start_date, end_date, days, reason, status] = line.split(",").map(s => s.trim());
      if (!email) continue;

      const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single();
      if (!profile) continue;

      const { error } = await supabase.from("leave_requests").insert({
        user_id: profile.id,
        type: type || "vacation",
        start_date,
        end_date,
        days: parseFloat(days) || 1,
        reason: reason || "Imported",
        status: status || "approved",
      });

      if (!error) {
        success++;
        // Update balance if approved
        if ((status || "approved") === "approved") {
          const year = new Date(start_date).getFullYear();
          const field = type === "medical" ? "sick_taken" : "vacation_taken";
          const { data: bal } = await supabase.from("leave_balances").select(field).eq("user_id", profile.id).eq("year", year).single();
          const current = bal?.[field] || 0;
          await supabase.from("leave_balances").upsert({
            user_id: profile.id,
            year,
            [field]: current + parseFloat(days),
          }, { onConflict: "user_id,year" });
        }
      }
    }

    setMessage(`Imported ${success} records`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Import Past Vacations</h1>
      <p className="mb-4 text-gray-600">Use the template to import already-taken leave from this year.</p>

      <button onClick={downloadTemplate} className="px-4 py-2 bg-indigo-600 text-white rounded mb-4">Download CSV Template</button>

      <div className="bg-white p-6 rounded-xl shadow max-w-md">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4" />
        <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded">Import</button>
        {message && <p className="mt-4 text-green-700">{message}</p>}
      </div>
    </div>
  );
}
