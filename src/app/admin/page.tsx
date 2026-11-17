export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/admin/security" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">Security & Audit</a>
        <a href="/admin/users" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">Users & Roles</a>
        <a href="/admin/rules" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">Rules & Holidays</a>
        <a href="/admin/telegram" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">Telegram Setup</a>
        <a href="/overview" className="bg-white p-6 rounded-xl shadow hover:shadow-lg">Team Overview</a>
      </div>
    </div>
  );
}
