"use client";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Rules, Holidays & Closures</h1>

      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Leave Bonus Rules</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>No sick leave Jan–June → +1 extra vacation day that year</li>
          <li>No sick leave July–Dec → +1 extra day starting next January</li>
          <li>Carry-forward max configurable per user/role</li>
        </ul>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Save Rules</button>
      </section>

      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Aruba Public Holidays</h2>
        <p className="text-gray-600 mb-4">Import official Aruba holidays. These company-closed days are <strong>not deducted</strong> from vacation balance if they fall inside a request.</p>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded">Import Aruba Holidays</button>
      </section>

      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Company Closure Days</h2>
        <p className="text-gray-600 mb-4">Special company closure days that <strong>are deducted</strong> from vacation. If the employee is already on approved vacation covering that day, it is not double-counted.</p>
        <button className="px-4 py-2 bg-purple-600 text-white rounded">Add Closure Day</button>
      </section>
    </div>
  );
}
