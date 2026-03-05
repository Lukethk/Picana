import { motion } from 'framer-motion';
import { HOURS_DATA } from '../../data/chartData';

export default function BarChart() {
    const max = Math.max(...HOURS_DATA.map(h => h.sales), 1);
    const peak = HOURS_DATA.reduce((a, b) => (b.sales > a.sales ? b : a));

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="text-slate-800 font-semibold text-sm">Ventas por Hora</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Unidades vendidas — hoy</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1 font-medium">
                    Pico: {peak.hour}
                </span>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-1.5" style={{ height: 140 }}>
                {HOURS_DATA.map((h, i) => {
                    const isPeak = h.sales === peak.sales;
                    const pct = (h.sales / max) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity
                              bg-slate-800 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                                {h.sales} uds.
                            </div>

                            <div className="w-full flex items-end justify-center" style={{ height: 128 }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${pct}%` }}
                                    transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
                                    className={`w-full rounded-t-md ${isPeak ? 'bg-indigo-600' : 'bg-indigo-100 group-hover:bg-indigo-300 transition-colors'
                                        }`}
                                />
                            </div>
                            <span className="text-slate-400 text-xs">{h.hour}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
