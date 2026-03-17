import { motion } from 'framer-motion';

export default function BarChart({ orders = [], subtitle = 'Unidades vendidas — hoy' }) {
    const minHour = 8;
    const maxHour = 22;

    const chartData = Array.from({ length: maxHour - minHour + 1 }, (_, idx) => {
        const hour = minHour + idx;
        return { hour, units: 0 };
    });

    for (const o of orders) {
        const ts = typeof o?.ts === 'number' ? o.ts : Number(o?.ts);
        if (!Number.isFinite(ts)) continue;
        const h = new Date(ts).getHours();
        const entry = chartData.find(d => d.hour === h);
        if (!entry) continue;
        entry.units += Number(o?.items ?? 0);
    }

    const max = Math.max(...chartData.map(h => h.units), 1);
    const peak = chartData.reduce((a, b) => (b.units > a.units ? b : a), chartData[0]);

    const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="text-slate-800 font-semibold text-sm dark:text-slate-100">Ventas por Hora</h3>
                    <p className="text-slate-400 text-xs mt-0.5 dark:text-slate-400">{subtitle}</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1 font-medium dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900/60">
                    Pico: {hourLabel(peak.hour)}
                </span>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-1.5" style={{ height: 140 }}>
                {chartData.map((h, i) => {
                    const isPeak = h.units === peak.units && peak.units > 0;
                    const pct = (h.units / max) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity
                              bg-slate-800 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-10 dark:bg-slate-950 dark:text-slate-100">
                                {h.units} uds.
                            </div>

                            <div className="w-full flex items-end justify-center" style={{ height: 128 }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${pct}%` }}
                                    transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
                                    className={`w-full rounded-t-md ${isPeak ? 'bg-indigo-600' : 'bg-indigo-100 group-hover:bg-indigo-300 transition-colors dark:bg-slate-700 dark:group-hover:bg-slate-600'
                                        }`}
                                />
                            </div>
                            <span className="text-slate-400 text-xs dark:text-slate-500">{String(h.hour).padStart(2, '0')}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
