export default function StatCard({ label, value, accent = 'ocean', description }) {
  const accentClasses = {
    ocean: 'from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-100',
    mint: 'from-emerald-50 to-emerald-100 text-emerald-700 ring-1 ring-emerald-100',
    amber: 'from-amber-50 to-amber-100 text-amber-700 ring-1 ring-amber-100',
    rose: 'from-red-50 to-red-100 text-red-700 ring-1 ring-red-100'
  };

  return (
    <div className="glass-panel rounded-xl p-5 fade-in-up">
      <div className={`rounded-xl bg-gradient-to-br ${accentClasses[accent]} p-4`}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slateui-500">{label}</p>
        <div className="mt-2 text-3xl font-bold text-slateui-900">{value}</div>
        {description ? <p className="mt-2 text-sm text-slateui-600">{description}</p> : null}
      </div>
    </div>
  );
}