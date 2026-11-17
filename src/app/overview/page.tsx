"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function OverviewPage() {
  const [users, setUsers] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, leave_balances(*)");
      setUsers(data || []);
    };
    load();
  }, []);

  const exportExcel = async () => {
    // Placeholder – implement with ExcelJS on server or client
    alert("Excel export will generate monthly vacation days per employee for payroll. Implement with exceljs.");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Team Overview</h1>
        <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg">Export Excel</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Vacation Left</th>
              <th className="p-3">Sick Taken</th>
              <th className="p-3">Carry Forward</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const bal = u.leave_balances?.[0];
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.full_name || u.email}</td>
                  <td className="p-3">{(bal?.vacation_allocated ?? 20) - (bal?.vacation_taken ?? 0)}</td>
                  <td className="p-3">{bal?.sick_taken ?? 0}</td>
                  <td className="p-3">{bal?.carry_forward ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
