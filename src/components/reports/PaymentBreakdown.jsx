import { motion } from 'framer-motion';
import { Banknote, Smartphone } from 'lucide-react';

const METHODS = [
    { key: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'bg-emerald-500' },
    { key: 'qr', label: 'QR', icon: Smartphone, color: 'bg-indigo-500' },
];

export default function PaymentBreakdown({ orders }) {
    const total = orders.length || 1;

    const counts = Object.fromEntries(METHODS.map(m => [m.key, 0]));
    orders.forEach(o => {
        const key = String(o?.method || o?.payment_method || '').toLowerCase();
        if (counts[key] !== undefined) counts[key]++;
    });

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-slate-800 font-semibold text-sm mb-4">Metodos de Pago</h3>
            <div className="space-y-4">
                {METHODS.map(({ key, label, icon: Icon, color }) => {
                    const count = counts[key];
                    const pct = Math.round((count / total) * 100);
                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                                    <Icon size={13} />
                                    {label}
                                </div>
                                <span className="text-slate-500 text-xs">{count} pedido{count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.7, ease: 'easeOut' }}
                                    className={`h-full ${color} rounded-full`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
