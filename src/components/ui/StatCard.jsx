import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, sub, accent = 'indigo' }) {
    const colors = {
        indigo: 'bg-indigo-600',
        emerald: 'bg-emerald-600',
        amber: 'bg-amber-500',
        rose: 'bg-rose-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start gap-4"
        >
            <div className={`w-10 h-10 rounded-lg ${colors[accent] ?? colors.indigo} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 text-2xl font-bold leading-tight mt-0.5">{value}</p>
                {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}
