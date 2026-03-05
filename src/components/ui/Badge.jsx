const STATUS_MAP = {
    ok: { label: 'Disponible', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    warn: { label: 'Stock Bajo', dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    critical: { label: 'Critico', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function Badge({ status }) {
    const cfg = STATUS_MAP[status] ?? STATUS_MAP.ok;
    return (
        <span
            className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${cfg.bg} ${cfg.text} ${cfg.border}
      `}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}
