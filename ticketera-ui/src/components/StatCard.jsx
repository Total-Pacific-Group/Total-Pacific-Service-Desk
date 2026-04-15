export default function StatCard({ label, valor, color = '#1a3a6b', icono }) {
  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {icono && (
        <div
          className="text-2xl w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          {icono}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold" style={{ color }}>
          {valor ?? '—'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}