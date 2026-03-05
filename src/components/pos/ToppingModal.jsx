import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { formatBs } from '../../utils/format';

export default function ToppingModal({ cup, availableToppings = [], onConfirm, onCancel }) {
    const [selected, setSelected] = useState([]);

    const categories = useMemo(() => {
        // Handle case where availableToppings is undefined/null
        if (!availableToppings) return [];
        const cats = new Set(availableToppings.map(t => t.category || t.type || 'Otros'));
        return Array.from(cats).sort(); 
    }, [availableToppings]);

    const toggle = (t) => {
        setSelected(prev =>
            prev.find(x => x.id === t.id) ? prev.filter(x => x.id !== t.id) : [...prev, t]
        );
    };

    const totalExtra = selected.reduce((s, t) => s + (t.price_extra || t.extra || 0), 0);
    const total = cup.price + totalExtra;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 24 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-slate-900 font-bold text-base">Personalizar pedido</h2>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {cup.name} — Base {formatBs(cup.price)}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Topping list */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                    {categories.length > 0 ? categories.map(cat => (
                        <div key={cat}>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {cat}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {availableToppings.filter(t => (t.category || t.type || 'Otros') === cat).map(t => {
                                    const active = !!selected.find(x => x.id === t.id);
                                    const extraPrice = t.price_extra || t.extra || 0;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => toggle(t)}
                                            className={`
                        flex items-center justify-between p-3 rounded-lg border text-left
                        transition-all cursor-pointer text-sm
                        ${active
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50'
                                                }
                      `}
                                        >
                                            <div>
                                                <p className="font-medium text-xs">{t.name}</p>
                                                <p className={`text-xs mt-0.5 ${extraPrice > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600'}`}>
                                                    {extraPrice > 0 ? `+ Bs. ${extraPrice}` : 'Gratis'}
                                                </p>
                                            </div>
                                            {active && <CheckCircle2 size={14} className="text-indigo-600 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            No hay toppings disponibles
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-slate-500 text-sm">
                            {selected.length} topping{selected.length !== 1 ? 's' : ''}
                            {totalExtra > 0 && <span className="text-amber-600 ml-1">(+{formatBs(totalExtra)})</span>}
                        </p>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs">Total item</p>
                            <p className="text-indigo-700 font-bold text-lg">{formatBs(total)}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onConfirm(cup, selected)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl
                       shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all"
                    >
                        Agregar al pedido
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
