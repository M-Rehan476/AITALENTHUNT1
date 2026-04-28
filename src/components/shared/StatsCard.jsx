export default function StatsCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-emerald-600 to-emerald-700',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-600 to-teal-700',
    slate: 'from-slate-600 to-slate-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.blue} rounded-xl p-5 text-white shadow-lg`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
